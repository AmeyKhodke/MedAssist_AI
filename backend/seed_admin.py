import database
import bcrypt
import os

def seed_admin():
    print("Seeding Admin User...")
    email = "admin@medassist.ai"
    password = "admin123"
    name = "Admin User"
    phone = "0000000000"
    
    # Check if admin already exists
    existing = database.get_customer_by_email(email)
    if existing:
        print(f"Admin user {email} already exists.")
        return

    # Hash password
    hashed_pwd = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create admin
    user_id = database.create_customer(name, email, phone, hashed_pwd, role="admin")
    print(f"Created admin user: {email} (ID: {user_id})")

if __name__ == "__main__":
    # Ensure DB is initialized
    database.init_db()
    seed_admin()
