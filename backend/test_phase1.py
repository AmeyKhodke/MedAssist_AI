import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_backend():
    print("Testing Backend Phase 1...")
    
    # 1. Get Medicines
    try:
        resp = requests.get(f"{BASE_URL}/medicines")
        if resp.status_code == 200:
            print("✅ GET /medicines: Success")
            meds = resp.json()
            print(f"   Saved {len(meds)} medicines.")
        else:
            print(f"❌ GET /medicines: Failed ({resp.status_code})")
    except Exception as e:
        print(f"❌ GET /medicines: Error {e}")
        return

    # 2. Order Paracetamol (Success Case)
    order_payload = {
        "user_id": "TEST001",
        "medicine": "Paracetamol",
        "quantity": 2,
        "total_price": 5.0
    }
    try:
        resp = requests.post(f"{BASE_URL}/orders", json=order_payload)
        if resp.status_code == 200:
            print("✅ POST /orders (Valid): Success")
        else:
            print(f"❌ POST /orders (Valid): Failed ({resp.status_code}) - {resp.text}")
    except Exception as e:
        print(f"❌ POST /orders (Valid): Error {e}")

    # 3. Order Amoxicillin (Prescription Case - Expect Fail in Phase 1)
    rx_payload = {
        "user_id": "TEST001",
        "medicine": "Amoxicillin",
        "quantity": 10,
        "total_price": 158.0
    }
    try:
        resp = requests.post(f"{BASE_URL}/orders", json=rx_payload)
        if resp.status_code == 400 and "Prescription required" in resp.text:
            print("✅ POST /orders (Rx Required): Correctly Rejected")
        else:
            print(f"❌ POST /orders (Rx Required): Unexpected response ({resp.status_code}) - {resp.text}")
    except Exception as e:
        print(f"❌ POST /orders (Rx Required): Error {e}")

if __name__ == "__main__":
    # Wait a bit for server to start if running immediately
    time.sleep(2) 
    test_backend()
