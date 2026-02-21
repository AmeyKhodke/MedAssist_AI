import requests

BASE_URL = "http://localhost:8000"
USER_ID = "TEST_CHITCHAT_USER"

# 1. Test Greeting
print(f"--- 1. Testing Greeting ---")
resp1 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "Hello there", "user_id": USER_ID}).json()
print("Response:", resp1['result'])
if "AI Pharmacist" in resp1['result']:
    print("SUCCESS: Greeting matched.")
else:
    print("FAILURE: Greeting not matched.")

# 2. Test Delivery
print(f"\n--- 2. Testing Delivery Question ---")
resp2 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "How long is shipping?", "user_id": USER_ID}).json()
print("Response:", resp2['result'])
if "business days" in resp2['result']:
    print("SUCCESS: Delivery info provided.")
else:
    print("FAILURE: Delivery info missing.")

# 3. Test Unknown
print(f"\n--- 3. Testing Unknown ---")
resp3 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "What is the capital of Mars?", "user_id": USER_ID}).json()
print("Response:", resp3['result'])
if "identify a medicine" in resp3['result']:
    print("SUCCESS: Fallback used.")
