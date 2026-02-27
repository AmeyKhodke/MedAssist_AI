import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import sqlite3

# Load variables at module import so they are ready
load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

def get_user_email_safely(user_id: str):
    """Safely fetch email without touching database.py to avoid merge conflicts."""
    try:
        # We explicitly connect to the DB here to keep this file 100% isolated
        conn = sqlite3.connect("pharmacy.db")
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT email, name FROM customers WHERE user_id = ?", (user_id,)).fetchone()
        conn.close()
        
        if row and row['email']:
            return {"email": row['email'], "name": row['name']}
        return None
    except Exception as e:
        print(f"Failed to fetch user email: {e}")
        return None

def send_email(subject: str, body: str, to_email: str):
    """Core function to send an email via SMTP"""
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("WARNING: SMTP credentials not set in .env. Skipping email payload:")
        print(f"To: {to_email}\nSubject: {subject}\nBody:\n{body}\n---")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = to_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body, 'plain'))

        # Standard TLS connection
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        return False

def notify_order_success(user_id: str, order_id: str, total_price: float, items: list):
    """Sends emails to both user and admin when an order is placed."""
    user_data = get_user_email_safely(user_id)
    
    # Format the items list cleanly
    items_str = "\n".join([f"- {item['qty']}x {item['name']}" for item in items])
    
    # 1. Email the User
    if user_data and user_data['email']:
        user_subject = f"Order Confirmation: {order_id}"
        user_body = f"Hello {user_data['name']},\n\nYour order {order_id} has been successfully placed.\n\nItems:\n{items_str}\n\nTotal: ₹{total_price}\n\nThank you for choosing our pharmacy!"
        send_email(user_subject, user_body, user_data['email'])
        
    # 2. Email the Admin
    if ADMIN_EMAIL:
        admin_subject = f"New Order Alert: {order_id}"
        admin_body = f"A new order was placed by User {user_id}.\n\nItems:\n{items_str}\n\nTotal: ₹{total_price}"
        send_email(admin_subject, admin_body, ADMIN_EMAIL)

def notify_proactive_refill(user_id: str, user_name: str, medicine: str, days_remaining: int):
    """Sends email alerts for proactive refills."""
    user_data = get_user_email_safely(user_id)
    
    # 1. Email the User
    if user_data and user_data['email']:
        user_subject = f"Refill Reminder: {medicine}"
        user_body = f"Hello {user_name or user_data['name']},\n\nThis is a friendly reminder that your prescription for {medicine} is due for a refill in {days_remaining} days.\n\nPlease log in to place your order so you don't run out."
        send_email(user_subject, user_body, user_data['email'])
        
    # 2. Email the Admin (Optional, usually good to know who is running out)
    if ADMIN_EMAIL:
        admin_subject = f"Refill Alert: User {user_id}"
        admin_body = f"User {user_id} ({user_name}) is running low on {medicine} ({days_remaining} days remaining)."
        send_email(admin_subject, admin_body, ADMIN_EMAIL)
