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
    
    # Create cart_items table
    c.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            medicine TEXT,
            quantity INTEGER,
            price REAL,
            is_prescribed BOOLEAN DEFAULT 0,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add column if it doesn't exist (for existing SQLite databases)
    try:
        c.execute("ALTER TABLE cart_items ADD COLUMN is_prescribed BOOLEAN DEFAULT 0")
    except sqlite3.OperationalError:
        pass

    
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
                
                # Apply heuristic to automatically flag common prescription drugs
                rx_keywords = ['amox', 'mycin', 'azepam', 'pril', 'statin', 'cillin', 'floxacin', 'sartan', 'olol', 'odone']
                name_lower = name.lower()
                prescription_required = any(kw in name_lower for kw in rx_keywords)
                
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

def get_dashboard_summary():
    conn = get_db_connection()
    c = conn.cursor()

    # Total medicines
    c.execute("SELECT COUNT(*) FROM medicines")
    total_medicines = c.fetchone()[0]

    # Low stock (below 50 units)
    c.execute("SELECT COUNT(*) FROM medicines WHERE stock < 50")
    low_stock_count = c.fetchone()[0]

    # All-time total revenue
    c.execute("SELECT COALESCE(SUM(total_price), 0) FROM orders")
    total_revenue = c.fetchone()[0]

    # Total orders placed
    c.execute("SELECT COUNT(*) FROM orders")
    total_orders = c.fetchone()[0]

    # Current month profit (revenue × 40% margin as a practical estimate)
    c.execute("SELECT date(MAX(timestamp)) FROM orders")
    max_date = c.fetchone()[0]
    if max_date:
        current_month = max_date[:7]
        c.execute(
            "SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE strftime('%Y-%m', timestamp) = ?",
            (current_month,)
        )
        monthly_revenue = c.fetchone()[0]
        monthly_profit = monthly_revenue * 0.40  # 40% margin estimate
    else:
        monthly_profit = 0.0

    conn.close()
    return {
        "total_medicines": total_medicines,
        "low_stock_count": low_stock_count,
        "total_revenue": round(total_revenue, 2),
        "today_revenue": round(total_revenue, 2),  # kept for backward compat
        "monthly_profit": round(monthly_profit, 2),
        "total_orders": total_orders,
    }

def get_sales_analytics():
    conn = get_db_connection()
    query = '''
        SELECT 
            date(o.timestamp) as order_date,
            SUM(o.total_price) as total_sales,
            SUM(o.total_price - (m.unit_price * 0.6 * o.quantity)) as total_profit
        FROM orders o
        JOIN medicines m ON o.medicine = m.name
        GROUP BY order_date
        ORDER BY order_date ASC
        LIMIT 30
    '''
    rows = conn.execute(query).fetchall()
    conn.close()
    return [{"order_date": r["order_date"], "total_sales": round(r["total_sales"], 2), "total_profit": round(r["total_profit"], 2)} for r in rows]

def get_inventory_analytics():
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM medicines").fetchall()
    conn.close()
    
    inventory = []
    for row in rows:
        med = dict(row)
        med['reorder_threshold'] = 50
        med['procurement_cost'] = round(med['unit_price'] * 0.6, 2)
        if med['unit_price'] > 0:
            med['profit_margin'] = round(((med['unit_price'] - med['procurement_cost']) / med['unit_price']) * 100, 2)
        else:
            med['profit_margin'] = 0.0
            
        if med['stock'] == 0:
            med['status'] = 'Out of Stock'
        elif med['stock'] < med['reorder_threshold']:
            med['status'] = 'Low Stock'
        else:
            med['status'] = 'In Stock'
            
        inventory.append(med)
    return inventory

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

def add_to_cart(user_id: str, medicine: str, quantity: int, price: float, is_prescribed: bool = False):
    conn = get_db_connection()
    # Check if exists, update qty if does
    cur = conn.execute('SELECT quantity, is_prescribed FROM cart_items WHERE user_id = ? AND medicine = ?', (user_id, medicine))
    row = cur.fetchone()
    if row:
        new_qty = row['quantity'] + quantity
        new_is_prescribed = row['is_prescribed'] or is_prescribed
        conn.execute('UPDATE cart_items SET quantity = ?, price = ?, is_prescribed = ? WHERE user_id = ? AND medicine = ?', 
                     (new_qty, price * new_qty / quantity if quantity else price, new_is_prescribed, user_id, medicine))
    else:
        conn.execute('INSERT INTO cart_items (user_id, medicine, quantity, price, is_prescribed) VALUES (?, ?, ?, ?, ?)',
                     (user_id, medicine, quantity, price, is_prescribed))
    conn.commit()
    conn.close()

def get_cart(user_id: str):
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM cart_items WHERE user_id = ? ORDER BY added_at ASC', (user_id,)).fetchall()
    conn.close()
    return [dict(row) for row in items]

def clear_cart(user_id: str):
    conn = get_db_connection()
    conn.execute('DELETE FROM cart_items WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()

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

def create_prescription_approval(user_id: str, medicine: str, prescription_url: str, status: str = 'pending'):
    conn = get_db_connection()
    conn.execute('INSERT INTO prescription_approvals (user_id, medicine, prescription_url, status) VALUES (?, ?, ?, ?)', (user_id, medicine, prescription_url, status))
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
