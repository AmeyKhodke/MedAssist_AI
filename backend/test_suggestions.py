import requests

BASE_URL = "http://localhost:8000"
USER_ID = "TEST_SUGGEST_USER"

# 1. Partial Match
print(f"--- 1. Testing Suggestion 'Cystinol' ---")
# "Cystinol akut" should be suggested
resp1 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "I need Cystinol", "user_id": USER_ID}).json()
print("Response:", resp1['result'])

if "Did you mean" in resp1['result'] and "Cystinol" in resp1['result']:
    print("SUCCESS: Suggestions provided.")
else:
    print("FAILURE: No suggestions.")

# 2. Random/No Match
print(f"\n--- 2. Testing No Match 'XyzAbc' ---")
resp2 = requests.post(f"{BASE_URL}/agent/chat", json={"text": "I need XyzAbc", "user_id": USER_ID}).json()
print("Response:", resp2['result'])
if "I couldn't identify" in resp2['result'] or "Did you mean" not in resp2['result']:
     print("SUCCESS: Fallback handled correctly.")
