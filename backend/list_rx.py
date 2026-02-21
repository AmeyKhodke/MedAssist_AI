import sqlite3
import pandas as pd
import os

DB_PATH = "d:/Hackathon/pharmacy-agent/backend/pharmacy.db"
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print("--- Prescription Required Medicines ---")
cursor.execute("SELECT name FROM medicines WHERE prescription_required = 1")
meds = cursor.fetchall()

with open("rx_list.txt", "w", encoding="utf-8") as f:
    if not meds:
        f.write("No prescription medicines found.")
    else:
        for i, (name,) in enumerate(meds, 1):
            f.write(f"{i}. {name}\n")

conn.close()
