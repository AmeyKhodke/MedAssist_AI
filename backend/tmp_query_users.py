import sqlite3
import pandas as pd

DB_PATH = "pharmacy.db"

def show_users():
    conn = sqlite3.connect(DB_PATH)
    headers = ['user_id', 'name', 'email', 'phone', 'age', 'gender', 'medicine', 'last_purchase_date']
    df = pd.read_sql_query("SELECT " + ", ".join(headers) + " FROM customers LIMIT 20", conn)
    with open('users_out.md', 'w', encoding='utf-8') as f:
        f.write("| " + " | ".join(headers) + " |\n")
        f.write("| " + " | ".join(['---'] * len(headers)) + " |\n")
        for _, row in df.iterrows():
            f.write("| " + " | ".join([str(x) for x in row]) + " |\n")
    conn.close()

if __name__ == "__main__":
    show_users()
