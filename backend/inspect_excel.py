import pandas as pd
import os

files = [
    "d:/Hackathon/pharmacy-agent/backend/Consumer Order History 1.xlsx",
    "d:/Hackathon/pharmacy-agent/backend/products-export.xlsx"
]

for f in files:
    print(f"--- Inspecting {os.path.basename(f)} ---")
    try:
        if "Consumer" in f:
            df = pd.read_excel(f, header=4)
        else:
            df = pd.read_excel(f)
        print("Columns:", df.columns.tolist())
        print("Head:")
        print(df.head(3))
        print("\n")
    except Exception as e:
        print(f"Error reading {f}: {e}")
