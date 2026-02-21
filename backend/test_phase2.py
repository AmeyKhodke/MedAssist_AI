import requests
import time

BASE_URL = "http://localhost:8000"

def test_agents():
    print("\nTesting Agents Phase 2...")
    
    # 1. Chat Order (Success)
    payload = {"text": "I need 5 paracetamol tablets please"}
    try:
        resp = requests.post(f"{BASE_URL}/agent/chat", json=payload)
        data = resp.json()
        if "Order placed for Paracetamol" in data.get("result", ""):
            print("✅ Agent Chat (Valid): Success")
        else:
            print(f"❌ Agent Chat (Valid): Failed - {data}")
    except Exception as e:
        print(f"❌ Agent Chat (Valid): Error {e}")

    # 2. Chat Order (Prescription Fail)
    payload = {"text": "Send me 10 Amoxicillin"}
    try:
        resp = requests.post(f"{BASE_URL}/agent/chat", json=payload)
        data = resp.json()
        if data.get("status") == "rejected" and "Prescription required" in data.get("result", ""):
            print("✅ Agent Chat (Rx Check): Correctly Rejected")
        else:
            print(f"❌ Agent Chat (Rx Check): Unexpected - {data}")
    except Exception as e:
        print(f"❌ Agent Chat (Rx Check): Error {e}")

    # 3. Proactive Alerts
    try:
        resp = requests.get(f"{BASE_URL}/agent/alerts")
        alerts = resp.json()
        print(f"ℹ️  Proactive Alerts: Found {len(alerts)} alerts")
        for a in alerts:
            print(f"   - {a['name']}: {a['message']}")
    except Exception as e:
        print(f"❌ Proactive Alerts: Error {e}")

if __name__ == "__main__":
    time.sleep(1)
    test_agents()
