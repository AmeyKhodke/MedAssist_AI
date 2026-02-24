from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import models
import database
import langfuse_client
import httpx

app = FastAPI(title="Pharmacy Agent Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    database.init_db()

@app.get("/medicines")
def get_medicines():
    return database.get_all_medicines()

@app.get("/inventory/status")
def get_inventory_status():
    meds = database.get_all_medicines()
    return {"medicines": meds}

@app.post("/orders")
def create_order(order: models.Order, background_tasks: BackgroundTasks):
    # 1. Langfuse check
    trace = langfuse_client.trace_interaction("create_order", order.dict())
    
    # 2. Check stock and rules
    conn = database.get_db_connection()
    medicine = conn.execute("SELECT * FROM medicines WHERE name = ?", (order.medicine,)).fetchone()
    conn.close()
    
    if not medicine:
        if trace: trace.end()
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    if medicine['stock'] < order.quantity:
        if trace: trace.end()
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {medicine['stock']}")
        
    if medicine['prescription_required']:
        # In Phase 1, we reject all prescription meds on direct API calls if no proof 
        # (Though we have no proof field yet)
        if trace: trace.end()
        raise HTTPException(status_code=400, detail="Prescription required for this medicine")

    # 3. Deduct stock
    try:
        new_stock = database.update_stock(order.medicine, order.quantity)
    except ValueError as e:
        if trace: trace.end()
        raise HTTPException(status_code=400, detail=str(e))
        
    # 4. Record order
    database.create_order(order.user_id, order.medicine, order.quantity, order.total_price)
    
    # 5. POST /webhook/fulfill (Mock)
    # Using background task to simulate async processing or just call directly
    # background_tasks.add_task(httpx.post, "http://localhost:8000/webhook/fulfill", json={"order_id": "ORD_MOCK", "status": "pending"})
    
    if trace: trace.end()
    return {"status": "confirmed", "new_stock": new_stock}

@app.post("/webhook/fulfill")
def fulfill_webhook(payload: dict):
    print(f"FULFILL: {payload}")
    return {"status": "dispatched"}

# --- PHASE 2: AGENT ENDPOINTS ---
import agents

class ChatRequest(BaseModel):
    text: str
    user_id: Optional[str] = "GUEST"
    prescription_verified: Optional[bool] = False

@app.post("/agent/chat")
def agent_chat_process(request: ChatRequest):
    user_id = request.user_id
    text = request.text.strip()
    
    # 0. Save User Message
    database.save_chat_message(user_id, "user", text)

    # --- CONFIRMATION LOGIC ---
    # Check if user said "yes" or "confirm"
    if text.lower() in ["no", "cancel", "abort", "nevermind"]:
        resp = "Order cancelled."
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp}

    if text.lower() in ["yes", "confirm", "ok", "sure", "please", "confirm order"]:
        # Retrieve history to find the pending order
        # We need the last message from assistant
        history = database.get_chat_history(user_id)
        if not history:
             resp = "I don't have a pending order to confirm."
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
        
        last_msg = history[-1]['content'] # Last assistant msg
        # We need to find the one BEFORE the current user "yes". 
        # get_chat_history returns ascending. So last one is the "yes" we just saved? 
        # Let's check. save_chat_message was called above. So history[-1] is USER "yes".
        # History[-2] should be ASSISTANT "Do you want to confirm...?"
        
        if len(history) < 2:
             resp = "I don't have a pending order to confirm."
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
             
        # Look for the pending order prompt in recent history
        # We look backwards
        pending_text = None
        for i in range(len(history)-2, -1, -1):
            msg = history[i]
            if msg['role'] == 'assistant' and "Do you want to confirm" in msg['content']:
                pending_text = history[i-1]['content'] # The USER order request before that?
                # Actually, simpler: The assistant msg contains the details: "I have found X..."
                # But to EXECUTE, we need to re-run the extraction on the original user text.
                # So we need the USER message that triggered that assistant response.
                if i > 0 and history[i-1]['role'] == 'user':
                     pending_text = history[i-1]['content']
                break
        
        if not pending_text:
             resp = "I couldn't find a recent order to confirm."
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
             
        # Re-process the original text with force_execute=True logic (or just normal flow but skip confirmation check)
        # To avoid recursion, let's extract and execute directly here.
        
        extraction = agents.extractor.run(pending_text, user_id=user_id)
        extraction["prescription_verified"] = request.prescription_verified # Reuse current status
        safety = agents.safety.run(extraction, user_id=user_id)
        
        if not safety["approved"]:
             resp = f"Safety check failed: {safety['reason']}"
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp, "status": "rejected"}
             
        execution = agents.executor.run(safety, user_id=user_id)
        if execution["status"] == "success":
            med_names = ", ".join([m['name'] for m in safety['medicines']])
            resp = f"Order Placed! {med_names}. Total: ₹{execution['total_price']}"
            database.save_chat_message(user_id, "assistant", resp)
            langfuse_client.flush()
            return {"result": resp, "data": execution}
        else:
            resp = f"Order failed: {execution.get('error')}"
            database.save_chat_message(user_id, "assistant", resp)
            langfuse_client.flush()
            return {"result": resp, "error": execution.get("error")}

    # --- NORMAL ORDER FLOW ---
    # 1. Extract Order
    extraction = agents.extractor.run(text, user_id=user_id)
    if not extraction["medicines"]:
        # Check for suggestions
        suggestions = extraction.get("suggestions", [])
        if suggestions:
            sugg_str = ", ".join(suggestions[:3]) # Show top 3
            resp = f"I couldn't find that exact medicine. Did you mean: {sugg_str}?"
        else:
            # Check for Chitchat
            chitchat_resp = agents.chitchat.run(text)
            if chitchat_resp:
                resp = chitchat_resp
            else:
                resp = "I couldn't identify a medicine. Please specify the name and quantity."
            
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp}
    
    # 2. Safety Check (Preliminary)
    extraction["prescription_verified"] = request.prescription_verified
    safety_result = agents.safety.run(extraction, user_id=user_id)
    
    if not safety_result["approved"]:
        resp = f"I cannot process this order. {safety_result['reason']}"
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp, "status": "rejected"}
    
    # 3. CONFIRMATION PROMPT
    # Instead of executing, we ask for confirmation.
    med_summary = ", ".join([f"{m['qty']}x {m['name']}" for m in safety_result['medicines']])
    
    # Calculate approx price for display
    total_est = 0
    conn = database.get_db_connection()
    for m in safety_result['medicines']:
        r = conn.execute("SELECT unit_price FROM medicines WHERE name = ?", (m['name'],)).fetchone()
        if r: total_est += r['unit_price'] * m['qty']
    conn.close()
    
    resp = f"I found: {med_summary}. Total approx: ₹{total_est:.2f}. Do you want to confirm?"
    database.save_chat_message(user_id, "assistant", resp)
    
    langfuse_client.flush()
    return {
        "result": resp, 
        "data": {}, # No execution data yet
        "status": "pending_confirmation"
    }

@app.get("/chat/history/{user_id}")
def get_chat_history(user_id: str):
    return database.get_chat_history(user_id)

@app.get("/agent/alerts")
def get_proactive_alerts(user_id: Optional[str] = None):
    # If user_id provided, we could filter. 
    # For Admin, we want ALL. For Client, we might want only theirs.
    alerts = agents.proactive.run_scan()
    if user_id:
        alerts = [a for a in alerts if a['user_id'] == user_id]
    return alerts

@app.get("/orders/{user_id}")
def get_user_orders(user_id: str):
    return database.get_orders_by_user(user_id)

class NotificationRequest(BaseModel):
    user_id: str
    message: str

@app.post("/notifications")
def send_notification(note: NotificationRequest):
    database.create_notification(note.user_id, note.message)
    return {"status": "sent", "user_id": note.user_id}

@app.get("/notifications/{user_id}")
def get_user_notifications(user_id: str):
    return database.get_notifications(user_id)

@app.get("/admin/approvals")
def get_admin_approvals():
    return database.get_pending_approvals()

class ApprovalStatusUpdate(BaseModel):
    status: str # "approved" or "rejected"

@app.post("/admin/approvals/{approval_id}")
def update_admin_approval(approval_id: int, update: ApprovalStatusUpdate):
    if update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # In a real app we'd fetch the approval to get the user_id and medicine first
    # For now we'll do a quick query
    conn = database.get_db_connection()
    approval = conn.execute("SELECT * FROM prescription_approvals WHERE id = ?", (approval_id,)).fetchone()
    conn.close()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    database.update_approval_status(approval_id, update.status)
    
    # Notify user
    medicine = approval['medicine']
    if update.status == "approved":
        msg = f"Your prescription for {medicine} has been approved! You can now place your order."
    else:
        msg = f"Your prescription for {medicine} was rejected. Please contact support."
    
    database.create_notification(approval['user_id'], msg)
    
    return {"status": "success", "approval_id": approval_id, "new_status": update.status}
