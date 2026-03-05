import sqlite3
conn = sqlite3.connect('pharmacy.db')
conn.row_factory = sqlite3.Row
rows = conn.execute(
    'SELECT user_id, email, auth_provider, CASE WHEN password IS NULL OR password = "" THEN "NO PASSWORD" ELSE "HAS PASSWORD (bcrypt)" END as pwd_status FROM customers ORDER BY user_id'
).fetchall()
for r in rows:
    print(f"{r['user_id']} | {r['email']} | {r['pwd_status']} | provider={r['auth_provider']}")
conn.close()
