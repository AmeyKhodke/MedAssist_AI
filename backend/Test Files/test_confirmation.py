import requests
import time

BASE_URL = "http://localhost:8000"
USER_ID = "TEST_CONFIRM_USER"

# 1. Initiate Order
print(f"--- 1. Initiating Order for {USER_ID} ---")
resp1 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "I need 1 Augentropfen RedCare", "user_id": USER_ID}).json()
print("Response:", resp1['result'])
if "Do you want to confirm" not in resp1['result']:
    print("FAILURE: Did not ask for confirmation.")
else:
    print("SUCCESS: Asked for confirmation.")

time.sleep(1)

# 2. Confirm Order
print(f"\n--- 2. Confirming Order ---")
resp2 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "Yes", "user_id": USER_ID}).json()
print("Response:", resp2['result'])
if "Order Placed" in resp2['result']:
    print("SUCCESS: Order confirmed and placed.")
else:
    print("FAILURE: Order not placed after confirmation.")
