import database
import os
import sqlite3

# Force init (if db doesn't exist, which we just deleted)
print("Initializing Database...")
database.init_db()

conn = database.get_db_connection()

print("\n--- Medicines ---")
meds = conn.execute("SELECT name, stock, unit_price, description, pzn FROM medicines LIMIT 5").fetchall()
for m in meds:
    print(dict(m))

print(f"\nTotal Medicines: {conn.execute('SELECT count(*) FROM medicines').fetchone()[0]}")

print("\n--- Customers ---")
custs = conn.execute("SELECT user_id, name, medicine, last_purchase_date, age, gender FROM customers LIMIT 5").fetchall()
for c in custs:
    print(dict(c))

print(f"\nTotal Customers: {conn.execute('SELECT count(*) FROM customers').fetchone()[0]}")

print("\n--- Orders ---")
orders = conn.execute("SELECT * FROM orders LIMIT 5").fetchall()
for o in orders:
    print(dict(o))

print(f"\nTotal Orders: {conn.execute('SELECT count(*) FROM orders').fetchone()[0]}")

print("\n--- Test Agent Logic (Proactive) ---")
import agents
alerts = agents.proactive.run_scan()
print(f"Generated {len(alerts)} alerts.")
for a in alerts[:3]:
    print(a)

conn.close()
