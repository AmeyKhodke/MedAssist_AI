from fastapi import FastAPI, HTTPException, BackgroundTasks, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles
import os
import shutil
import uuid
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

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- FINANCIAL STATE ---
total_revenue = 0.0
total_profit = 0.0

def add_to_financial_totals(new_sale: float):
    global total_revenue, total_profit
    total_revenue += new_sale
    profit_margin = new_sale * 0.40
    total_profit += profit_margin
    
    # Log the observability trace
    trace = langfuse_client.trace_interaction("financial_update", {
        "new_sale": new_sale,
        "profit_added": profit_margin,
        "new_total_revenue": total_revenue,
        "new_total_profit": total_profit
    })
    if trace:
        trace.update(tags=["financials", "real-time"])
        trace.end()
    
    # Optional debug print
    print(f"[OBSERVABILITY] Transaction detected... Updating Total Revenue by ₹{new_sale:.2f}... New Total: ₹{total_revenue:.2f}")

@app.on_event("startup")
def startup_event():
    database.init_db()
    
    # Initialize globals from historical data
    global total_revenue, total_profit
    conn = database.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT COALESCE(SUM(total_price), 0) FROM orders")
    base_revenue = c.fetchone()[0]
    total_revenue = float(base_revenue)
    total_profit = total_revenue * 0.40
    conn.close()
    print(f"[STARTUP] Financials Initialized - Revenue: ₹{total_revenue:.2f}, Profit: ₹{total_profit:.2f}")

@app.get("/api/dashboard/summary")
def get_live_dashboard_summary():
    # Return real-time globals blended with database counts
    summary = database.get_dashboard_summary()
    return {
        **summary,
        "total_revenue": round(total_revenue, 2),
        "today_revenue": round(total_revenue, 2), # UI fallback
        "monthly_profit": round(total_profit, 2)  # Update UI to use all-time profit
    }

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

@app.post("/agent/upload_prescription")
async def upload_prescription(user_id: str = Form(...), session_id: Optional[str] = Form(None), file: UploadFile = File(...)):
    # Save the file
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"http://localhost:8000/static/uploads/{filename}"
    
    # Process with Gemini
    with open(file_path, "rb") as f:
        file_bytes = f.read()
        
    mime_type = file.content_type or "image/jpeg"
    extraction = agents.extract_from_image(file_bytes, mime_type)
    
    added_meds = []
    unrecognized = []
    conn = database.get_db_connection()
    for med in extraction.get("medicines", []):
        name = med["name"]
        qty = med["qty"]
        
        # Verify it exists in DB (Exact match first)
        r = conn.execute("SELECT name, unit_price FROM medicines WHERE name = ?", (name,)).fetchone()
        if not r:
            # Fallback to LIKE match
            r = conn.execute("SELECT name, unit_price FROM medicines WHERE name LIKE ?", (f"%{name}%",)).fetchone()
            
        if r:
            exact_name = r['name']
            price = r['unit_price'] * qty
            # Add to cart as prescribed
            database.add_to_cart(user_id, exact_name, qty, price, is_prescribed=True)
            added_meds.append(f"{qty}x {exact_name}")
        else:
            unrecognized.append(name)
            
    conn.close()
    
    # Store the prescription itself in the admin dashboard immediately
    med_summary_parts = []
    if added_meds:
        med_summary_parts.append(", ".join(added_meds))
    if unrecognized:
        med_summary_parts.append(f"(Unrecognized: {', '.join(unrecognized)})")
    if extraction.get("suggestions"):
        med_summary_parts.append(f"(Suggestions: {', '.join(extraction['suggestions'])})")
        
    final_summary = " ".join(med_summary_parts) if med_summary_parts else "No medications recognized."
    
    # Send it to admin as 'uploaded'
    database.create_prescription_approval(user_id, final_summary, file_url, status="uploaded")
    
    # Chat response
    resp = f"Prescription uploaded successfully. Extracted and added {', '.join(added_meds) if added_meds else 'no recognized medicines'} to your cart as prescribed."
    if unrecognized or extraction.get("suggestions"):
        resp += " Some items were not found in our inventory."
    
    database.save_chat_message(user_id, "assistant", resp, session_id)
    langfuse_client.flush()
    
    return {
        "result": resp,
        "prescription_url": file_url,
        "added_meds": added_meds
    }

class ChatRequest(BaseModel):
    text: str
    user_id: Optional[str] = "GUEST"
    prescription_verified: Optional[bool] = False
    session_id: Optional[str] = None

@app.post("/agent/chat")
def agent_chat_process(request: ChatRequest):
    user_id = request.user_id
    text = request.text.strip()
    session_id = request.session_id
    
    # Auto-create session if none provided
    if not session_id:
        session_id = database.create_chat_session(user_id, "New Consultation")
    
    # 0. Save User Message
    database.save_chat_message(user_id, "user", text, session_id)

    # --- CONFIRMATION LOGIC ---
    # Check if user said "yes" or "confirm"
    if text.lower() in ["no", "cancel", "abort", "nevermind"]:
        resp = "Order cancelled."
        database.save_chat_message(user_id, "assistant", resp, session_id)
        return {"result": resp, "session_id": session_id}

    if text.lower() in ["yes", "confirm", "ok", "sure", "please", "confirm order"]:
        # Retrieve cart from database
        cart_items = database.get_cart(user_id)
        if not cart_items:
             resp = "Your cart is currently empty."
             database.save_chat_message(user_id, "assistant", resp, session_id)
             return {"result": resp, "session_id": session_id}
        
        conn = database.get_db_connection()
        pending_approval_meds = []
        approved_meds = []
        
        for item in cart_items:
            med = item['medicine']
            qty = item['quantity']
            is_prescribed = item['is_prescribed']
            
            r = conn.execute("SELECT prescription_required FROM medicines WHERE name = ?", (med,)).fetchone()
            req_rx = r['prescription_required'] if r else False
            
            if req_rx and not is_prescribed:
                # Needs admin approval
                # Try to find a recent prescription URL for this user
                past_rx = conn.execute("SELECT prescription_url FROM prescription_approvals WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1", (user_id,)).fetchone()
                rx_url = past_rx['prescription_url'] if past_rx else ""
                
                # Check if it was already approved
                if database.check_approved_prescription(user_id, med):
                     approved_meds.append({"name": med, "qty": qty})
                else:
                    database.create_prescription_approval(user_id, med, rx_url)
                    pending_approval_meds.append(f"{qty}x {med}")
            else:
                approved_meds.append({"name": med, "qty": qty})
                
        conn.close()
        
        # We process approved meds if any
        resp_parts = []
        execution_data = None
        
        if approved_meds:
            extraction = {
                "medicines": approved_meds,
                "prescription_verified": True
            }
            safety = agents.safety.run(extraction, user_id=user_id)
            if not safety["approved"]:
                resp_parts.append(f"Safety check failed for some items: {safety['reason']}.")
            else:
                execution = agents.executor.run(safety, user_id=user_id)
                if execution["status"] == "success":
                    med_names = ", ".join([m['name'] for m in safety['medicines']])
                    resp_parts.append(f"Order Placed successfully for {med_names}. Total: ₹{execution['total_price']:.2f}.")
                    
                    # Update global financial state
                    add_to_financial_totals(execution['total_price'])
                    
                    execution_data = execution
                else:
                    resp_parts.append(f"Order failed: {execution.get('error')}.")
                    
        if pending_approval_meds:
            pending_str = ", ".join(pending_approval_meds)
            resp_parts.append(f"Medicines requiring a prescription ({pending_str}) have been sent to the admin for approval.")
            
        resp = " ".join(resp_parts)
        database.clear_cart(user_id)
        database.save_chat_message(user_id, "assistant", resp, session_id)
        langfuse_client.flush()
        
        status = "success" if execution_data else "pending_admin" if pending_approval_meds else "rejected"
        return {"result": resp, "status": status, "data": execution_data, "session_id": session_id}

    # --- SHOW CART LOGIC ---
    if text.lower() in ["show cart", "view cart", "my cart", "show my cart", "cart"]:
        cart_items = database.get_cart(user_id)
        if not cart_items:
            resp = "Your cart is empty."
            database.save_chat_message(user_id, "assistant", resp, session_id)
            return {"result": resp, "session_id": session_id}
            
        formatted_meds = [{"name": item['medicine'], "qty": item['quantity']} for item in cart_items]
        total_est = sum(item['price'] for item in cart_items)
        med_summary = ", ".join([f"{m['qty']}x {m['name']}" for m in formatted_meds])
        
        resp = f"You have {len(formatted_meds)} items in your cart. Total approx: ₹{total_est:.2f}. Do you want to confirm?"
        database.save_chat_message(user_id, "assistant", resp, session_id)
        langfuse_client.flush()
        return {
            "result": resp, 
            "data": {
                "cart_items": formatted_meds,
                "total_price": total_est
            },
            "status": "pending_confirmation",
            "session_id": session_id
        }

    # --- NORMAL ORDER FLOW ---
    # 1. Extract Order
    extraction = agents.extractor.run(text, user_id=user_id)
    llm_answer = extraction.get("answer", "I understood your request.")

    if not extraction["medicines"]:
        if extraction.get("error") == "gemini_rate_limit":
             resp = "Ah! I'm sorry, but my AI NLP Service has hit its Free API Rate Limit with Google Gemini. Please try again in an hour!"
             database.save_chat_message(user_id, "assistant", resp, session_id)
             return {"result": resp, "session_id": session_id}
             
        # Check for suggestions if it seems they wanted an item
        suggestions = extraction.get("suggestions", [])
        if suggestions and "price" not in text.lower():
            sugg_str = ", ".join(suggestions[:3]) # Show top 3
            resp = f"I couldn't find that exact medicine. Did you mean: {sugg_str}?"
        else:
            # Use the intelligent LLM answer! (Prices, Q&A, greetings)
            resp = llm_answer
            
        database.save_chat_message(user_id, "assistant", resp, session_id)
        return {"result": resp, "session_id": session_id}
    
    # 2. Safety Check (Preliminary)
    extraction["prescription_verified"] = False # No file uploaded directly in chat yet
    safety_result = agents.safety.run(extraction, user_id=user_id)
    
    if not safety_result["approved"]:
        resp = f"{llm_answer}\nHowever, I cannot add this: {safety_result['reason']}"
        database.save_chat_message(user_id, "assistant", resp, session_id)
        return {"result": resp, "status": safety_result.get("status", "rejected"), "session_id": session_id}
    
    # 3. Add Multiple Items to Cart
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
    
    # We use the LLM's natural conversational response
    resp = llm_answer
    
    database.save_chat_message(user_id, "assistant", resp, session_id)
    langfuse_client.flush()
    
    return {
        "result": resp,
        "status": "cart_added",
        "session_id": session_id
    }

# --- SESSION APIs ---
class SessionCreate(BaseModel):
    user_id: str
    title: str = "New Consultation"

@app.post("/api/chat/sessions")
def create_session(req: SessionCreate):
    session_id = database.create_chat_session(req.user_id, req.title)
    return {"session_id": session_id}

@app.get("/api/chat/sessions/{user_id}")
def get_user_sessions(user_id: str):
    return database.get_chat_sessions(user_id)

@app.delete("/api/chat/sessions/{session_id}")
def delete_session(session_id: str):
    database.delete_chat_session(session_id)
    return {"status": "deleted"}

@app.get("/api/chat/history/{session_id}")
def get_history_by_session(session_id: str):
    return database.get_chat_history_by_session(session_id)

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
            
            # Update global financial state
            add_to_financial_totals(execution['total_price'])
            
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
    return get_live_dashboard_summary()

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
