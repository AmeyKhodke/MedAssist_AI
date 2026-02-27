import sqlite3
import pandas as pd

DB_PATH = 'd:/Hackathon/pharmacy-agent/backend/pharmacy.db'

def view_db():
    conn = sqlite3.connect(DB_PATH)
    
    # 1. List Tables
    tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
    print("\n--- Tables ---")
    for t in tables:
        print(f"- {t[0]}")
        
    # 2. Show Row Counts & Sample
    print("\n--- Table Summaries ---")
    for t in tables:
        name = t[0]
        count = conn.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
        print(f"\nTable: {name} (Rows: {count})")
        
        # Show sample
        try:
            df = pd.read_sql_query(f"SELECT * FROM {name} LIMIT 3", conn)
            print(df.to_string(index=False))
        except Exception as e:
            print(f"Error reading sample: {e}")
            
    conn.close()

if __name__ == "__main__":
    view_db()
