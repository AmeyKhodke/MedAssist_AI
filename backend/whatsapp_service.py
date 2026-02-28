import os
import sqlite3
import threading

try:
    import pywhatkit
    PYWHATKIT_AVAILABLE = True
except ImportError:
    PYWHATKIT_AVAILABLE = False
    print("WARNING: pywhatkit python package not found.")

ADMIN_PHONE = os.getenv("ADMIN_PHONE", "+1234567890") # Dummy admin phone

def get_user_phone_safely(user_id: str) -> str:
    """Safely retrieves a user's phone number."""
    try:
        conn = sqlite3.connect("pharmacy.db")
        conn.row_factory = sqlite3.Row
        user = conn.execute("SELECT phone FROM customers WHERE user_id = ?", (user_id,)).fetchone()
        conn.close()
        
        if user and user['phone'] and str(user['phone']).strip():
            phone = str(user['phone']).strip()
            # Ensure E.164 format and no whatsapp prefix (pywhatkit format)
            if not phone.startswith('+'):
                phone = '+' + phone 
            phone = phone.replace('whatsapp:', '')
            return phone
            
    except Exception as e:
        print(f"Error fetching phone for {user_id}: {e}")
        
    # Return a safe dummy fallback that will just be logged, not actually sent if it fails validation
    return f"+1999{user_id.replace('PAT', '')}000"

def send_whatsapp_message(to_number: str, message_body: str) -> bool:
    """Sends a WhatsApp message via PyWhatKit by opening WhatsApp Web."""
    # Ensure To number has NO 'whatsapp:' prefix for pywhatkit
    to_number = to_number.replace("whatsapp:", "").strip()

    print(f"\n[WhatsApp PyWhatKit Log] -> Preparing to send to: {to_number}")
    print(f"Message: {message_body}\n")

    # If it is an obvious dummy number, skip the browser popup
    if "1999" in to_number or to_number == "+1234567890":
        print(f"User has a dummy phone number ({to_number}). Skipping PyWhatKit browser automation. Message considered 'sent' in Dummy Mode.")
        return True

    if PYWHATKIT_AVAILABLE:
        # We must run this in a separate thread!
        # PyWhatKit uses time.sleep() and blocks execution for 15+ seconds while it controls the browser.
        # If we ran this on the main thread, the FastAPI web request for checkout would timeout or hang.
        def _send_background():
            try:
                print(f"Opening WhatsApp Web to send message to {to_number} (Takes ~15 seconds)...")
                # wait_time=15s (default) gives the browser time to load web.whatsapp.com
                # tab_close=True will close the tab after sending
                pywhatkit.sendwhatmsg_instantly(
                    phone_no=to_number,
                    message=message_body,
                    wait_time=15,
                    tab_close=True,
                    close_time=3
                )
                print(f"✅ PyWhatKit automation finished for {to_number}!")
            except Exception as e:
                print(f"❌ PyWhatKit Failed to send to {to_number}: {e}")

        # Start the background automation thread
        threading.Thread(target=_send_background, daemon=True).start()
        return True
    else:
        print(f"PyWhatKit not installed. Cannot send to {to_number}.")
        return False

def notify_order_success(user_id: str, order_id: str, total_price: float, items: list):
    """Formats and sends a WhatsApp confirmation for a new order."""
    to_phone = get_user_phone_safely(user_id)
    
    # 1. Format Message for the User
    items_str = "\n".join([f"- {item['qty']}x {item['name']}" for item in items])
    
    user_msg = (
        f"🏥 *Pharmacy Agent - Order Confirmed!*\n\n"
        f"Thank you, {user_id}. Your order has been successfully placed.\n\n"
        f"*Order ID:* {order_id}\n"
        f"*Total:* ₹{total_price:.2f}\n\n"
        f"*Items:*\n{items_str}\n\n"
        f"We will notify you when it is dispatched. Stay healthy! ⚕️"
    )
    
    send_whatsapp_message(to_phone, user_msg)
    
    # 2. Format Message for the Admin
    admin_msg = (
        f"🔔 *NEW ORDER ALERT*\n\n"
        f"User *{user_id}* placed order {order_id} for ₹{total_price:.2f}.\n"
        f"Items: {', '.join([str(i['qty']) + 'x ' + i['name'] for i in items])}"
    )
    send_whatsapp_message(ADMIN_PHONE, admin_msg)

def notify_proactive_refill(user_id: str, medicine: str, days_left: int):
    """Formats and sends a WhatsApp alert for a low-stock medication."""
    to_phone = get_user_phone_safely(user_id)
    
    urgency = "🔴 *URGENT*" if days_left <= 2 else "🟡 *Reminder*"
    
    user_msg = (
        f"{urgency} Refill Alert from Pharmacy Agent!\n\n"
        f"Hi {user_id},\n"
        f"Our records indicate you only have *{days_left} days* left of your *{medicine}*.\n\n"
        f"Reply \"Order {medicine}\" to this chat right now to get a refill delivered before you run out! 🚚"
    )
    
    send_whatsapp_message(to_phone, user_msg)
