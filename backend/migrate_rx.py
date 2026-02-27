"""
One-time migration: Mark all medicines with ® symbol as prescription_required = 1
Run this once from the backend directory.
"""
import sqlite3

conn = sqlite3.connect('pharmacy.db')
cursor = conn.cursor()

# Find all medicines with ® in their name
meds = cursor.execute("SELECT name FROM medicines WHERE name LIKE '%®%'").fetchall()
print(f"Found {len(meds)} medicines with ® symbol:")
for (name,) in meds:
    print(f"  - {name}")

# Update them all to prescription_required = 1
cursor.execute("UPDATE medicines SET prescription_required = 1 WHERE name LIKE '%®%'")
conn.commit()

print(f"\n✅ Updated {cursor.rowcount} medicines to prescription_required = 1")

# Verify
updated = cursor.execute("SELECT name, prescription_required FROM medicines WHERE name LIKE '%®%' LIMIT 5").fetchall()
for name, req in updated:
    print(f"  {name}: prescription_required = {req}")

conn.close()
