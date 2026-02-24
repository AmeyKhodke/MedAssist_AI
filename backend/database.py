import sqlite3
import pandas as pd
import os
from contextlib import contextmanager

DB_PATH = "pharmacy.db"
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create medicines table
    # Added description and pzn
    c.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            name TEXT PRIMARY KEY,
            stock INTEGER,
            unit_price REAL,
            unit_type TEXT,
            prescription_required BOOLEAN,
            category TEXT,
            max_daily_dose TEXT,
            description TEXT,
            pzn TEXT
        )
    ''')
    
    # Create orders table
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            medicine TEXT,
            quantity INTEGER,
            total_price REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create customers table
    c.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            phone TEXT,
            email TEXT,
            medicine TEXT,
            dosage_frequency TEXT,
            last_purchase_date TEXT,
            last_quantity INTEGER,
            avg_monthly_usage INTEGER,
            age INTEGER,
            gender TEXT
        )
    ''')
    
    # Create notifications table
    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            message TEXT,
            read BOOLEAN DEFAULT 0,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create chat_history table
    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            role TEXT,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create prescription_approvals table
    c.execute('''
        CREATE TABLE IF NOT EXISTS prescription_approvals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            medicine TEXT,
            prescription_url TEXT,
            status TEXT DEFAULT 'pending',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    
    # Load Initial Data
    load_excel_data()

# ... (rest of file remains same until end) ...

def get_orders_by_user(user_id: str):
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY timestamp DESC', (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in orders]

def create_notification(user_id: str, message: str):
    conn = get_db_connection()
    conn.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', (user_id, message))
    conn.commit()
    conn.close()

def get_notifications(user_id: str):
    conn = get_db_connection()
    notifs = conn.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC', (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in notifs]

def save_chat_message(user_id: str, role: str, content: str):
    conn = get_db_connection()
    conn.execute('INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)', (user_id, role, content))
    conn.commit()
    conn.close()

def get_chat_history(user_id: str, limit: int = 50):
    conn = get_db_connection()
    history = conn.execute('SELECT role, content, timestamp FROM chat_history WHERE user_id = ? ORDER BY timestamp ASC', (user_id,)).fetchall()
    conn.close()
    # If no history, return empty or default greeting? 
    # Let's return actual history. Frontend can handle default greeting.
    return [dict(row) for row in history]


def load_excel_data():
    conn = get_db_connection()
    c = conn.cursor()
    
    # 1. Load Medicines from products-export.xlsx
    # Columns: ['product id', 'product name', 'pzn', 'price rec', 'package size', 'descriptions']
    products_file = os.path.join(os.path.dirname(__file__), "products-export.xlsx")
    if os.path.exists(products_file):
        try:
            print(f"Loading medicines from {products_file}...")
            df = pd.read_excel(products_file)
            # Map columns
            # We need to handle duplicates if any, 'name' is PK. 
            # Strategy: Upsert or Replace. Let's use Replace logic for this training step.
            
            # Prepare list of tuples
            meds_to_insert = []
            for _, row in df.iterrows():
                name = str(row.get('product name', '')).strip()
                if not name or name == 'nan': continue
                
                # Default values for missing fields
                stock = 100 
                # price rec is string '12,95' or float. Need to clean.
                price_raw = row.get('price rec', 0)
                try:
                    if isinstance(price_raw, str):
                        price = float(price_raw.replace(',', '.'))
                    else:
                        price = float(price_raw)
                except:
                    price = 0.0
                    
                unit_type = "pack" # Default
                prescription_required = False # Default
                category = "General"
                max_daily_dose = "Unknown"
                description = str(row.get('descriptions', ''))
                pzn = str(row.get('pzn', ''))
                
                meds_to_insert.append((
                    name, stock, price, unit_type, prescription_required, category, max_daily_dose, description, pzn
                ))
            
            # Bulk Insert/Replace
            c.executemany('''
                INSERT OR REPLACE INTO medicines 
                (name, stock, unit_price, unit_type, prescription_required, category, max_daily_dose, description, pzn)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', meds_to_insert)
            conn.commit()
            print(f"Loaded {len(meds_to_insert)} medicines.")
            
        except Exception as e:
            print(f"Error loading medicines: {e}")

    # 2. Load Customers/Orders from Consumer Order History 1.xlsx
    # Header row is 4 (0-index based on previous inspection, so header=4 in pandas)
    history_file = os.path.join(os.path.dirname(__file__), "Consumer Order History 1.xlsx")
    if os.path.exists(history_file):
        try:
            print(f"Loading history from {history_file}...")
            df = pd.read_excel(history_file, header=4)
            
            # Columns: ['Patient ID', 'Patient Age', 'Patient Gender', 'Purchase Date', 'Product Name', 'Quantity', 'Total Price (EUR)', 'Dosage Frequency', 'Prescription Required']
            # Clean column names just in case
            df.columns = [c.strip() for c in df.columns]
            
            customers_map = {} # user_id -> dict
            orders_to_insert = []
            
            for _, row in df.iterrows():
                user_id = str(row.get('Patient ID', ''))
                if not user_id or user_id == 'nan': continue
                
                med_name = str(row.get('Product Name', '')).strip()
                qty = int(row.get('Quantity', 0)) if pd.notna(row.get('Quantity')) else 0
                price = float(row.get('Total Price (EUR)', 0)) if pd.notna(row.get('Total Price (EUR)')) else 0.0
                date_val = row.get('Purchase Date') # Timestamp/datetime
                
                # Handle Date
                timestamp_str = str(date_val)
                if isinstance(date_val, pd.Timestamp):
                    timestamp_str = date_val.strftime("%Y-%m-%d %H:%M:%S")
                
                # Store Order
                orders_to_insert.append((user_id, med_name, qty, price, timestamp_str))
                
                # Update Customer Info
                # We need to aggregate mainly. For 'last_purchase_date', we want the latest.
                age = int(row.get('Patient Age', 0)) if pd.notna(row.get('Patient Age')) else 0
                gender = str(row.get('Patient Gender', ''))
                dosage = str(row.get('Dosage Frequency', ''))
                
                # Check 'Prescription Required'. If 'Yes', update medicine table
                is_rx = str(row.get('Prescription Required', '')).lower() == 'yes'
                if is_rx:
                    # Mark medicine as Rx required
                    c.execute('UPDATE medicines SET prescription_required = 1 WHERE name = ?', (med_name,))
                
                if user_id not in customers_map:
                    customers_map[user_id] = {
                        "user_id": user_id,
                        "name": f"Patient {user_id}", # File doesn't have names, use ID
                        "phone": "",
                        "email": "",
                        "medicine": med_name, # Last one?
                        "dosage_frequency": dosage,
                        "last_purchase_date": timestamp_str,
                        "last_quantity": qty,
                        "avg_monthly_usage": qty, # Simple logic
                        "age": age,
                        "gender": gender
                    }
                else:
                    # Update if date is newer
                    existing = customers_map[user_id]
                    if timestamp_str > existing["last_purchase_date"]:
                        existing["last_purchase_date"] = timestamp_str
                        existing["medicine"] = med_name
                        existing["last_quantity"] = qty
                        existing["dosage_frequency"] = dosage
            
            # Insert Customers
            cust_list = [
                (v["user_id"], v["name"], v["phone"], v["email"], v["medicine"], v["dosage_frequency"], 
                 v["last_purchase_date"], v["last_quantity"], v["avg_monthly_usage"], v["age"], v["gender"])
                for v in customers_map.values()
            ]
            c.executemany('''
                INSERT OR REPLACE INTO customers 
                (user_id, name, phone, email, medicine, dosage_frequency, last_purchase_date, last_quantity, avg_monthly_usage, age, gender)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', cust_list)
            
            # Insert Orders
            c.executemany('''
                INSERT INTO orders (user_id, medicine, quantity, total_price, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', orders_to_insert)
            
            conn.commit()
            print(f"Loaded {len(cust_list)} customers and {len(orders_to_insert)} orders.")
            
        except Exception as e:
            print(f"Error loading history: {e}")
            import traceback
            traceback.print_exc()

    conn.close()

def get_all_medicines():
    conn = get_db_connection()
    medicines = conn.execute('SELECT * FROM medicines').fetchall()
    conn.close()
    return [dict(row) for row in medicines]

def update_stock(medicine_name: str, deduct_qty: int):
    conn = get_db_connection()
    # Check current stock
    cur = conn.execute('SELECT stock FROM medicines WHERE name = ?', (medicine_name,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise ValueError(f"Medicine {medicine_name} not found")
    
    current_stock = row['stock']
    if current_stock < deduct_qty:
        conn.close()
        raise ValueError(f"Insufficient stock for {medicine_name}. Available: {current_stock}")
        
    new_stock = current_stock - deduct_qty
    conn.execute('UPDATE medicines SET stock = ? WHERE name = ?', (new_stock, medicine_name))
    conn.commit()
    conn.close()
    return new_stock

def create_order(user_id, medicine, quantity, price):
    conn = get_db_connection()
    conn.execute('INSERT INTO orders (user_id, medicine, quantity, total_price) VALUES (?, ?, ?, ?)',
                 (user_id, medicine, quantity, price))
    conn.commit()
    conn.close()

def get_orders_by_user(user_id: str):
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders WHERE user_id = ? ORDER BY timestamp DESC', (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in orders]

def create_notification(user_id: str, message: str):
    conn = get_db_connection()
    conn.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', (user_id, message))
    conn.commit()
    conn.close()

def get_notifications(user_id: str):
    conn = get_db_connection()
    notifs = conn.execute('SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC', (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in notifs]

def create_prescription_approval(user_id: str, medicine: str, prescription_url: str):
    conn = get_db_connection()
    conn.execute('INSERT INTO prescription_approvals (user_id, medicine, prescription_url) VALUES (?, ?, ?)', (user_id, medicine, prescription_url))
    conn.commit()
    conn.close()

def get_pending_approvals():
    conn = get_db_connection()
    approvals = conn.execute("SELECT * FROM prescription_approvals WHERE status = 'pending' ORDER BY timestamp ASC").fetchall()
    conn.close()
    return [dict(row) for row in approvals]

def update_approval_status(approval_id: int, status: str):
    conn = get_db_connection()
    conn.execute('UPDATE prescription_approvals SET status = ? WHERE id = ?', (status, approval_id))
    conn.commit()
    conn.close()

def check_approved_prescription(user_id: str, medicine: str) -> bool:
    conn = get_db_connection()
    row = conn.execute("SELECT 1 FROM prescription_approvals WHERE user_id = ? AND medicine = ? AND status = 'approved' LIMIT 1", (user_id, medicine)).fetchone()
    conn.close()
    return row is not None
