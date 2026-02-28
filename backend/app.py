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
    import json
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
        
    mime_type = file.content_type
    if not mime_type:
        mime_type = "image/jpeg"
        if ext.lower() == ".pdf":
            mime_type = "application/pdf"
        elif ext.lower() == ".txt":
            mime_type = "text/plain"
            
    extraction = agents.extract_from_image(file_bytes, mime_type)
    
    matched_meds = []
    unrecognized = []
    suggestions = extraction.get("suggestions", [])
    doctor_name = extraction.get("doctor_name", "Not Specified")
    
    conn = database.get_db_connection()
    
    for med in extraction.get("medicines", []):
        name = med["name"]
        qty = med["qty"]
        
        # Verify it exists in DB (Exact match first)
        r = conn.execute("SELECT name, unit_price, prescription_required FROM medicines WHERE name = ?", (name,)).fetchone()
        if not r:
            # Fallback to LIKE match
            r = conn.execute("SELECT name, unit_price, prescription_required FROM medicines WHERE name LIKE ?", (f"%{name}%",)).fetchone()
            
        if r:
            exact_name = r['name']
            price = r['unit_price'] * qty
            req_rx = bool(r['prescription_required'])
            
            matched_meds.append({
                "name": exact_name,
                "qty": qty,
                "price": price,
                "req_rx": req_rx
            })
        else:
            unrecognized.append(name)
            
    conn.close()
    
    # Formulate Admin Summary
    med_summary_parts = []
    if matched_meds:
        med_summary_parts.append("Recognized: " + ", ".join([f"{m['qty']}x {m['name']}" for m in matched_meds]))
    if unrecognized:
        med_summary_parts.append(f"Unrecognized: {', '.join(unrecognized)}")
    if suggestions:
        med_summary_parts.append(f"Suggestions: {', '.join(suggestions)}")
        
    final_summary = " | ".join(med_summary_parts) if med_summary_parts else "No medications recognized."
    
    # Set to pending so Admin can review before adding to cart
    extracted_data_json = json.dumps({"matched_meds": matched_meds, "unrecognized": unrecognized})
    status = "pending"
    
    # Store in queue for admin review (does not add to cart yet)
    database.create_prescription_approval(
        user_id, final_summary, file_url, status=status, 
        extracted_data=extracted_data_json, doctor_name=doctor_name
    )
    
    resp = "Prescription uploaded successfully. It has been sent to our Admin queue for medical review. Once approved, the medicines will be automatically added to your cart."
    database.save_chat_message(user_id, "assistant", resp, session_id)
    langfuse_client.flush()
    
    return {
        "result": resp,
        "prescription_url": file_url,
        "status": status,
        "matched_meds": matched_meds
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
    is_new_session = False
    if not session_id:
        title = text[:30] + "..." if len(text) > 30 else text
        if not title: title = "New Consultation"
        session_id = database.create_chat_session(user_id, title)
        is_new_session = True
    
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
                    database.create_prescription_approval(user_id, med, rx_url, doctor_name="Not Specified")
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
    
    # 1. Quick Question Routing (Saves API limits for simple questions)
    text_lower = text.lower()
    is_question = any(q in text_lower for q in ['?', 'what', 'price', 'cost', 'how much', 'do you have', 'stock', 'available', 'tell me'])
    
    if is_question:
        chitchat_resp = agents.chitchat.run(text)
        if chitchat_resp:
            database.save_chat_message(user_id, "assistant", chitchat_resp)
            langfuse_client.flush()
            return {"result": chitchat_resp}
            
    # 2. Extract Order
    extraction = agents.extractor.run(text, user_id=user_id)
    llm_answer = extraction.get("answer", "I understood your request.")

    if not extraction["medicines"]:
        # Even if rate limit hit, let chitchat try its local regex fallbacks
        chitchat_resp = agents.chitchat.run(text)
        
        if chitchat_resp:
            resp = chitchat_resp
        elif extraction.get("error") in ["groq_rate_limit", "gemini_rate_limit"]:
             resp = "Ah! I'm sorry, but my AI NLP Service has hit its Free API Rate Limit. Please try again in an hour. You can still ask me about prices or stock!"
             database.save_chat_message(user_id, "assistant", resp, session_id)
             return {"result": resp, "session_id": session_id}
             
        # Check if the AI identified an item the user wants to buy but needs quantity confirmation
        elif extraction.get("pending_item_name"):
             item_name = extraction["pending_item_name"]
             resp = llm_answer # Should be "How much X do you need?"
             database.save_chat_message(user_id, "assistant", resp)
             return {
                 "result": resp, 
                 "status": "pending_quantity", 
                 "data": {"item_name": item_name}
             }
             
        else:
            suggestions = extraction.get("suggestions", [])
            if suggestions and "price" not in text.lower():
                sugg_str = ", ".join(suggestions[:3]) # Show top 3
                resp = f"I couldn't find that exact medicine. Did you mean: {sugg_str}?"
            else:
                resp = llm_answer if llm_answer else "I couldn't identify a medicine. Please specify the name and quantity."
            
        database.save_chat_message(user_id, "assistant", resp, session_id)
        langfuse_client.flush()
        return {"result": resp, "status": "added_to_cart", "session_id": session_id}
    
    # 2. Safety Check (Preliminary)
    extraction["prescription_verified"] = False # No file uploaded directly in chat yet
    safety_result = agents.safety.run(extraction, user_id=user_id)
    
    if not safety_result["approved"]:
        resp = f"{llm_answer}\nHowever, I cannot add this: {safety_result['reason']}"
        database.save_chat_message(user_id, "assistant", resp, session_id)
        return {"result": resp, "status": safety_result.get("status", "rejected"), "session_id": session_id}
    
    # 3. Require Prescription Upload OR Auto-Add to Cart
    conn = database.get_db_connection()
    otc_meds = []
    rx_meds = []
    
    # Check if any extracted medicine requires a prescription
    for med in extraction["medicines"]:
        name = med["name"]
        qty = med["qty"]
        row = conn.execute("SELECT prescription_required, unit_price FROM medicines WHERE name = ?", (name,)).fetchone()
        if row:
            if row['prescription_required']:
                rx_meds.append({"name": name, "qty": qty})
            else:
                price = row['unit_price'] * qty
                otc_meds.append({"name": name, "qty": qty, "price": price})
    
    resp_parts = []
    if otc_meds:
        otc_names = []
        for med in otc_meds:
            database.add_to_cart(user_id, med["name"], med["qty"], med["price"], is_prescribed=False)
            otc_names.append(f"{med['qty']}x {med['name']}")
        otc_summary = ", ".join(otc_names)
        resp_parts.append(f"Great! I have added {otc_summary} to your cart.")
        
    if rx_meds:
        rx_names = [f"{m['qty']}x {m['name']}" for m in rx_meds]
        rx_summary = ", ".join(rx_names)
        resp_parts.append(f"For {rx_summary}, a prescription is required. Please upload your prescription (PDF, JPG, PNG, or TXT format) first. Once uploaded, I will automatically extract the medicines, verify them with our inventory, and add them to your cart.")
    else:
        resp_parts.append("You can type 'view cart' to see your items or 'confirm' to place the order.")
        
    resp = " ".join(resp_parts)
    
    database.save_chat_message(user_id, "assistant", resp, session_id)
    langfuse_client.flush()
    conn.close()
    
    return {
        "result": resp,
        "status": "prescription_required" if rx_meds else "added_to_cart",
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

class SessionUpdate(BaseModel):
    title: str

@app.put("/api/chat/sessions/{session_id}")
def update_session(session_id: str, req: SessionUpdate):
    database.update_chat_session_title(session_id, req.title)
    return {"status": "updated"}

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
@app.get("/api/users/{user_id}")
def get_user(user_id: str):
    if user_id.lower() == "admin":
        return {
            "user_id": "admin",
            "name": "System Administrator",
            "email": "admin@medassist.ai",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=0061FF"
        }
    
    profile = database.get_user_profile(user_id)
    if not profile:
        profile = {"user_id": user_id, "name": f"Patient {user_id}", "email": f"{user_id}@example.com"}
        
    name = profile.get("name", f"Patient {user_id}")
    profile["avatar"] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={name}&backgroundColor=e2e8f0"
    
    return profile
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
    reason: Optional[str] = None

@app.post("/admin/approvals/{approval_id}")
def update_admin_approval(approval_id: int, update: ApprovalStatusUpdate):
    import json
    if update.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # In a real app we'd fetch the approval to get the user_id and medicine first
    # For now we'll do a quick query
    conn = database.get_db_connection()
    approval = conn.execute("SELECT * FROM prescription_approvals WHERE id = ?", (approval_id,)).fetchone()
    conn.close()
    
    if not approval:
        raise HTTPException(status_code=404, detail="Approval request not found")

    database.update_approval_status(approval_id, update.status, update.reason)
    
    # Action upon approval/rejection
    # Cast sqlite3.Row to dict to safely use .get()
    approval_dict = dict(approval)
    medicine_str = approval_dict['medicine']
    extracted_data = approval_dict.get('extracted_data')
    user_idd = approval_dict['user_id']
    
    # Trace the admin action in Langfuse
    trace = langfuse_client.trace_interaction(f"Admin_{update.status.capitalize()}", {"approval_id": approval_id, "medicine": medicine_str, "reason": update.reason}, user_id=user_idd)
    
    msg = ""
    if update.status == "approved":
        if extracted_data:
            # Policy Agent -> Admin Approval Flow
            data = json.loads(extracted_data)
            matched_meds = data.get("matched_meds", [])
            for m in matched_meds:
                database.add_to_cart(user_idd, m['name'], m['qty'], m['price'], is_prescribed=True)
                
            med_names = ", ".join([f"{m['qty']}x {m['name']}" for m in matched_meds])
            msg = f"Your uploaded prescription has been APPROVED by our medical team! The following medicines have been added to your cart: {med_names}. You can now checkout."
            database.save_chat_message(user_idd, "assistant", msg)
            langfuse_client.flush()
        else:
            # Legacy Chat Flow
            approved_order = {
                "medicines": [{"name": medicine_str, "qty": 1}] # Defaulting to 1 for this prototype
            }
            
            execution = agents.executor.run(approved_order, user_id=user_idd)
            if execution["status"] == "success":
                # Update global financial state
                add_to_financial_totals(execution['total_price'])
                
                msg = f"Your prescription for {medicine_str} has been approved! Order Placed! Total: ₹{execution['total_price']}"
                database.save_chat_message(user_idd, "assistant", msg)
                langfuse_client.flush()
            else:
                msg = f"Your prescription for {medicine_str} was approved, but order failed: {execution.get('error')}"
    else:
        if extracted_data:
            msg = f"Your uploaded prescription could not be verified and was REJECTED by our medical team. "
            if update.reason:
                msg += f"Reason: {update.reason}. "
            msg += "Please review and upload a valid prescription, or contact support."
        else:
            msg = f"Your prescription for {medicine_str} was rejected. "
            if update.reason:
                msg += f"Reason: {update.reason}. "
            msg += "Please contact support."
    
    # Also save as chat message
    database.save_chat_message(user_idd, "assistant", msg)
    database.create_notification(user_idd, msg)
    
    if trace:
        trace.update(output={"message": msg, "status": update.status})
        trace.end()
        
    langfuse_client.flush()
    
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

@app.get("/api/prescriptions")
def api_prescriptions():
    return database.get_all_prescriptions()

@app.post("/api/approvals/{approval_id}")
def api_update_approval(approval_id: int, update: ApprovalStatusUpdate):
    return update_admin_approval(approval_id, update)
