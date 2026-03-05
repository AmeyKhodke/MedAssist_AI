import sqlite3
import bcrypt

new_password = "password123"
hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

conn = sqlite3.connect('pharmacy.db')
cursor = conn.cursor()

cursor.execute("""
    UPDATE customers 
    SET password = ? 
    WHERE email != 'jejurkarom@gmail.com' 
    AND user_id != 'ADMIN'
""", (hashed,))

updated = cursor.rowcount
conn.commit()
conn.close()

print(f"Updated {updated} users to password: {new_password}")
