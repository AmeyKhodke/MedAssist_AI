import requests
import time

BASE_URL = "http://localhost:8000"
USER_ID = "TEST_PERSIST_USER"

print(f"--- 1. Sending Message for {USER_ID} ---")
requests.post(f"{BASE_URL}/agent/chat", json={"text": "Hello, my name is Alice", "user_id": USER_ID})

time.sleep(1)

print(f"--- 2. Fetching History for {USER_ID} ---")
history = requests.get(f"{BASE_URL}/chat/history/{USER_ID}").json()
print("History Items:", len(history))
for h in history:
    print(f"- [{h['role']}]: {h['content']}")

found = any("Alice" in h['content'] for h in history)
if found:
    print("\nSUCCESS: Chat history persisted.")
else:
    print("\nFAILURE: History not found.")
