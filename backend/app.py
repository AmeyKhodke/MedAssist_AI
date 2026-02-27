from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import models
import database
import langfuse_client
import httpx
from agents import extractor, safety, executor, proactive, chitchat

app = FastAPI(title="Pharmacy Agent Backend")

class CheckoutRequest(BaseModel):
    prescription_verified: bool = False

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
        # Retrieve cart from database
        cart_items = database.get_cart(user_id)
        if not cart_items:
             resp = "Your cart is currently empty."
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
        
        # Prepare payload for safety and execution
        # cart_items has 'medicine' and 'quantity' instead of 'name' and 'qty'
        formatted_meds = [{"name": item['medicine'], "qty": item['quantity']} for item in cart_items]
        
        extraction = {
            "medicines": formatted_meds,
            "prescription_verified": request.prescription_verified
        }
        
        safety = agents.safety.run(extraction, user_id=user_id)
        
        if not safety["approved"]:
             resp = f"Safety check failed: {safety['reason']}"
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp, "status": safety.get("status", "rejected")}
             
        execution = agents.executor.run(safety, user_id=user_id)
        if execution["status"] == "success":
            database.clear_cart(user_id) # Empty cart after success
            med_names = ", ".join([m['name'] for m in safety['medicines']])
            resp = f"Order Placed successfully! {med_names}. Total: ₹{execution['total_price']:.2f}"
            database.save_chat_message(user_id, "assistant", resp)
            langfuse_client.flush()
            return {"result": resp, "data": execution}
        else:
            resp = f"Order failed: {execution.get('error')}"
            database.save_chat_message(user_id, "assistant", resp)
            langfuse_client.flush()
            return {"result": resp, "error": execution.get("error")}

    # --- SHOW CART LOGIC ---
    if text.lower() in ["show cart", "view cart", "my cart", "show my cart", "cart"]:
        cart_items = database.get_cart(user_id)
        if not cart_items:
            resp = "Your cart is empty."
            database.save_chat_message(user_id, "assistant", resp)
            return {"result": resp}
            
        formatted_meds = [{"name": item['medicine'], "qty": item['quantity']} for item in cart_items]
        total_est = sum(item['price'] for item in cart_items)
        med_summary = ", ".join([f"{m['qty']}x {m['name']}" for m in formatted_meds])
        
        resp = f"You have {len(formatted_meds)} items in your cart. Total approx: ₹{total_est:.2f}. Do you want to confirm?"
        database.save_chat_message(user_id, "assistant", resp)
        langfuse_client.flush()
        return {
            "result": resp, 
            "data": {
                "cart_items": formatted_meds,
                "total_price": total_est
            },
            "status": "pending_confirmation"
        }

    # --- NORMAL ORDER FLOW ---
    # 1. Extract Order
    # 1. Extract Order
    extraction = agents.extractor.run(text, user_id=user_id)
    if not extraction["medicines"]:
        if extraction.get("error") == "gemini_rate_limit":
             resp = "Ah! I'm sorry, but my AI NLP Service has hit its Free API Rate Limit with Google Gemini. Please try again in an hour!"
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
             
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
    extraction["prescription_verified"] = False # No file uploaded directly in chat yet
    safety_result = agents.safety.run(extraction, user_id=user_id)
    
    if not safety_result["approved"]:
        resp = f"I cannot add this to your cart. {safety_result['reason']}"
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp, "status": safety_result.get("status", "rejected")}
    
    # 3. Add to Cart
    conn = database.get_db_connection()
    added_names = []
    
    for med in safety_result["medicines"]:
        name = med["name"]
        qty = med["qty"]
        # get price
        r = conn.execute("SELECT unit_price FROM medicines WHERE name = ?", (name,)).fetchone()
        price = (r['unit_price'] * qty) if r else 0.0
        
        database.add_to_cart(user_id, name, qty, price)
        added_names.append(f"{qty}x {name}")
        
    conn.close()
    
    med_summary = ", ".join(added_names)
    resp = f"Added {med_summary} to your cart."
    database.save_chat_message(user_id, "assistant", resp)
    langfuse_client.flush()
    
    # Just return text, UI cart will stay updated if we add endpoints
    return {
        "result": resp,
        "status": "cart_added"
    }

@app.get("/cart/{user_id}")
def get_user_cart(user_id: str):
    return database.get_cart(user_id)

@app.delete("/cart/{user_id}")
def clear_user_cart(user_id: str):
    database.clear_cart(user_id)
    return {"status": "cleared"}

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

@app.post("/cart/{user_id}/checkout")
def checkout_user_cart(user_id: str, request: CheckoutRequest):
    cart_items = database.get_cart(user_id)
    if not cart_items:
         raise HTTPException(status_code=400, detail="Cart is empty")
    
    formatted_meds = [{"name": item['medicine'], "qty": item['quantity']} for item in cart_items]
    
    extraction = {
        "medicines": formatted_meds,
        "prescription_verified": request.prescription_verified
    }
    
    safety_check = agents.safety.run(extraction, user_id=user_id)
    if not safety_check["approved"]:
         raise HTTPException(status_code=400, detail=f"Safety check failed: {safety_check['reason']}")
         
    execution = agents.executor.run(safety_check, user_id=user_id)
    if execution["status"] == "success":
        database.clear_cart(user_id)
        return {"status": "success", "data": execution}
    else:
        raise HTTPException(status_code=400, detail=f"Order failed: {execution.get('error')}")

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
    
    # Action upon approval/rejection
    medicine = approval['medicine']
    if update.status == "approved":
        # Simulate execution
        approved_order = {
            "medicines": [{"name": medicine, "qty": 1}] # Defaulting to 1 for this prototype
        }
        
        execution = agents.executor.run(approved_order, user_id=approval['user_id'])
        if execution["status"] == "success":
            msg = f"Your prescription for {medicine} has been approved! Order Placed! Total: ₹{execution['total_price']}"
            database.save_chat_message(approval['user_id'], "assistant", msg)
            langfuse_client.flush()
        else:
            msg = f"Your prescription for {medicine} was approved, but order failed: {execution.get('error')}"
    else:
        msg = f"Your prescription for {medicine} was rejected. Please contact support."
    
    database.create_notification(approval['user_id'], msg)
    
    return {"status": "success", "approval_id": approval_id, "new_status": update.status}

# --- PHASE 3: ADMIN DASHBOARD ANALYTICS ENDPOINTS ---

@app.get("/api/dashboard/summary")
def api_dashboard_summary():
    return database.get_dashboard_summary()

@app.get("/api/sales/analytics")
def api_sales_analytics():
    return database.get_sales_analytics()

@app.get("/api/inventory")
def api_inventory():
    return database.get_inventory_analytics()

@app.get("/api/refill/predictions")
def api_refill_predictions():
    alerts = agents.proactive.run_scan()
    mapped_alerts = []
    for a in alerts:
        mapped_alerts.append({
            "patient_id": a.get("user_id"),
            "medicine": a.get("medicine"),
            "predicted_refill_date": "Due Now" if a.get("days_since_purchase", 0) > 25 else "Upcoming",
            "confidence_score": min(99, 85 + a.get("days_since_purchase", 0)),
            "risk_indicator": "High" if a.get("days_since_purchase", 0) > 30 else "Medium"
        })
    # Sort by highest urgency
    mapped_alerts.sort(key=lambda x: x['confidence_score'], reverse=True)
    return mapped_alerts

@app.get("/api/approvals")
def api_approvals():
    return database.get_pending_approvals()

@app.post("/api/approvals/{approval_id}")
def api_update_approval(approval_id: int, update: ApprovalStatusUpdate):
    return update_admin_approval(approval_id, update)
