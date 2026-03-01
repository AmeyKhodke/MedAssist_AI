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
import bcrypt
import json
from agents import extractor, safety, executor, proactive, chitchat
import sarvam_service

class RegisterRequest(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    auth_provider: Optional[str] = "local"
    
class LoginRequest(BaseModel):
    email: str
    password: str


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

# --- AUTHENTICATION ---

@app.post("/auth/register")
def register_user(req: RegisterRequest):
    existing = database.get_customer_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8') if req.password else ""
    user_id = database.create_customer(req.name, req.email, req.phone, hashed_pwd, req.auth_provider)
    return {"status": "success", "user_id": user_id, "role": "client"}

@app.post("/auth/login")
def login_user(req: LoginRequest):
    user = database.get_customer_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Check if they are logging in via the Google Mock
    if user.get("auth_provider") == "google" and req.password == "google_auth_mock":
        return {"status": "success", "user_id": user["user_id"], "role": "client"}
        
    if not user.get("password") or not req.password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    try:
        is_valid = bcrypt.checkpw(req.password.encode('utf-8'), user["password"].encode('utf-8'))
    except ValueError:
        is_valid = False
        
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {"status": "success", "user_id": user["user_id"], "role": "client"}

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
async def upload_prescription(user_id: str = Form(...), file: UploadFile = File(...)):
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
    extraction = agents.extract_prescription_file(file_bytes, mime_type)
    
    added_meds = []
    unrecognized = []
    extracted_meds_data = [] # New: To store JSON data securely without adding to cart yet
    
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
            # Do NOT add to cart yet. Store for admin approval.
            extracted_meds_data.append({
                "name": exact_name,
                "qty": qty,
                "price": price
            })
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
    
    # Send it to admin as 'pending', attaching the secure extracted JSON items
    database.create_prescription_approval(
        user_id, 
        final_summary, 
        file_url, 
        status="pending", 
        extracted_items=json.dumps(extracted_meds_data),
        doctor_name=extraction.get("doctor_name")
    )
    
    # Chat response
    error_msg = extraction.get("error")
    if error_msg:
        if "429" in str(error_msg) or "rate" in str(error_msg).lower() or "exhausted" in str(error_msg).lower() or "limit" in str(error_msg).lower():
            resp = "Prescription uploaded successfully. ⚠️ Note: My AI vision engine is currently rate-limited by Groq. The document was sent to the Admin for manual review."
        else:
            resp = f"Prescription uploaded successfully. ⚠️ I encountered an AI parsing error: {str(error_msg)[:50]}. The document was sent to the Admin for manual review."
    else:
        resp = f"Prescription uploaded successfully. Found {', '.join(added_meds) if added_meds else 'no recognized medicines'} - sent to Admin for approval!"
        if unrecognized or extraction.get("suggestions"):
            resp += " Some items were not found in our inventory."
    
    database.save_chat_message(user_id, "assistant", resp)
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
    language: Optional[str] = "en-IN"

@app.post("/agent/chat")
def agent_chat_process(request: ChatRequest):
    user_id = request.user_id
    raw_text = request.text.strip()
    
    # --- TRANSLATION MIDDLEWARE: INBOUND ---
    # Translate incoming text to English (en-IN)
    # The Sarvam API will try to detect the source (e.g., 'hi-IN').
    t_in = sarvam_service.translate_text(raw_text, source_lang="Unknown", target_lang="en-IN")
    text = t_in.get("translated_text", raw_text)
    detected_source_lang = t_in.get("detected_source", "en-IN")
    
    # Fallback to English if detector got confused or failed
    if not detected_source_lang or detected_source_lang == "Unknown":
        detected_source_lang = "en-IN"
        
    print(f"[LANG] Detected: {detected_source_lang} | Original: '{raw_text}' | English: '{text}'")

    target_out_lang = request.language

    # 0. Save User Message
    database.save_chat_message(user_id, "user", raw_text)

    # Helper function to Translate Outbound
    def format_outbound_response(english_resp: str):
        if target_out_lang and target_out_lang != "en-IN":
            t_out = sarvam_service.translate_text(english_resp, source_lang="en-IN", target_lang=target_out_lang)
            return t_out.get("translated_text", english_resp)
        return english_resp

    # --- CONFIRMATION LOGIC ---
    # Check if user said "yes" or "confirm"
    if text.lower() in ["no", "cancel", "abort", "nevermind"]:
        resp = format_outbound_response("Order cancelled.")
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp}

    if text.lower() in ["yes", "confirm", "ok", "sure", "please", "confirm order"]:
        # Retrieve cart from database
        cart_items = database.get_cart(user_id)
        if not cart_items:
             resp = format_outbound_response("Your cart is currently empty.")
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
        
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
            
        final_english_resp = " ".join(resp_parts)
        resp = format_outbound_response(final_english_resp)
        database.clear_cart(user_id)
        database.save_chat_message(user_id, "assistant", resp)
        langfuse_client.flush()
        
        status = "success" if execution_data else "pending_admin" if pending_approval_meds else "rejected"
        return {"result": resp, "status": status, "data": execution_data}

    # --- SHOW CART LOGIC ---
    if text.lower() in ["show cart", "view cart", "my cart", "show my cart", "cart"]:
        cart_items = database.get_cart(user_id)
        if not cart_items:
            resp = format_outbound_response("Your cart is empty.")
            database.save_chat_message(user_id, "assistant", resp)
            return {"result": resp}
            
        formatted_meds = [{"name": item['medicine'], "qty": item['quantity']} for item in cart_items]
        total_est = sum(item['price'] for item in cart_items)
        med_summary = ", ".join([f"{m['qty']}x {m['name']}" for m in formatted_meds])
        
        eng_resp = f"You have {len(formatted_meds)} items in your cart. Total approx: ₹{total_est:.2f}. Do you want to confirm?"
        resp = format_outbound_response(eng_resp)
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

    # 1. Extract Order
    extraction = agents.extractor.run(text, user_id=user_id)
    llm_answer = extraction.get("answer", "I understood your request.")

    if not extraction["medicines"]:
        if extraction.get("error") == "groq_rate_limit":
             resp = format_outbound_response("Ah! I'm sorry, but my AI NLP Service has hit its Free API Rate Limit with Groq APIs. Please try again in an hour!")
             database.save_chat_message(user_id, "assistant", resp)
             return {"result": resp}
             
        # Check if the AI identified an item the user wants to buy but needs quantity confirmation
        if extraction.get("pending_item_name"):
             item_name = extraction["pending_item_name"]
             resp = format_outbound_response(llm_answer) # Should be "How much X do you need?"
             database.save_chat_message(user_id, "assistant", resp)
             return {
                 "result": resp, 
                 "status": "pending_quantity", 
                 "data": {"item_name": item_name}
             }
             
        # Check for suggestions if it seems they wanted an item
        suggestions = extraction.get("suggestions", [])
        if suggestions and "price" not in text.lower():
            sugg_str = ", ".join(suggestions[:3]) # Show top 3
            eng_resp = f"I couldn't find that exact medicine. Did you mean: {sugg_str}?"
            resp = format_outbound_response(eng_resp)
        else:
            # Use the intelligent LLM answer! (Prices, Q&A, greetings)
            resp = format_outbound_response(llm_answer)
            
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp}
    
    # 2. Safety Check (Preliminary)
    extraction["prescription_verified"] = False # No file uploaded directly in chat yet
    safety_result = agents.safety.run(extraction, user_id=user_id)
    
    if not safety_result["approved"]:
        eng_resp = f"{llm_answer}\nHowever, I cannot add this: {safety_result['reason']}"
        resp = format_outbound_response(eng_resp)
        database.save_chat_message(user_id, "assistant", resp)
        return {"result": resp, "status": safety_result.get("status", "rejected")}
    
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
    resp = format_outbound_response(llm_answer)
    
    database.save_chat_message(user_id, "assistant", resp)
    langfuse_client.flush()
    
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
    return database.get_all_approvals()

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
    if update.status == "approved":
        approval_dict = dict(approval)
        extracted_data = approval_dict.get('extracted_items')
        if not extracted_data:
            msg = f"Your prescription was approved, but no valid medications were found to add to your cart."
        else:
            try:
                items = json.loads(extracted_data)
                added_names = []
                for item in items:
                    database.add_to_cart(approval['user_id'], item['name'], item['qty'], item['price'], is_prescribed=True)
                    added_names.append(item['name'])
                msg = f"Your prescription has been approved! The following medications have been added to your cart: {', '.join(added_names)}."
            except Exception as e:
                print(f"Error parsing prescription items: {e}")
                msg = f"Your prescription was approved, but an error occurred adding items to your cart."
                
        database.save_chat_message(approval['user_id'], "assistant", msg)
        langfuse_client.flush()
    else:
        msg = f"Your prescription was rejected. Please contact support."
    
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

class AddMedicineRequest(BaseModel):
    name: str
    category: str
    price: float
    stock: int

@app.post("/api/inventory/add")
def api_add_inventory(req: AddMedicineRequest):
    success = database.add_medicine(req.name, req.category, req.price, req.stock)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to add medicine. It may already exist.")
    
    # Reload agents medicine list
    if hasattr(agents, 'extractor'):
        try:
            agents.extractor._medicine_names = agents.get_medicine_names()
        except Exception as e:
            print(f"Failed to refresh agent medicine list: {e}")
            
    return {"status": "success", "message": "Medicine added successfully"}

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
    return database.get_all_approvals()

@app.post("/api/approvals/{approval_id}")
def api_update_approval(approval_id: int, update: ApprovalStatusUpdate):
    return update_admin_approval(approval_id, update)

@app.get("/api/users")
def api_get_users():
    return database.get_all_customers()

@app.get("/api/users/{user_id}")
def api_get_user(user_id: str):
    user = database.get_customer_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
