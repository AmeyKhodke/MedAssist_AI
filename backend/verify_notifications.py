import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Get Alerts (Admin View)
print("\n--- 1. Fetching Alerts ---")
alerts = requests.get(f"{BASE_URL}/agent/alerts").json()
print(f"Found {len(alerts)} alerts.")
if alerts:
    print(f"Sample Alert: {alerts[0]}")
    target_user = alerts[0]['user_id']
else:
    print("No alerts found. Using 'PAT001' as target.")
    target_user = "PAT001"

# 2. Send Notification (Admin Action)
print(f"\n--- 2. Sending Notification to {target_user} ---")
msg = "Refill Reminder: Your medication is running low."
resp = requests.post(f"{BASE_URL}/notifications", json={"user_id": target_user, "message": msg})
print(f"Send Response: {resp.status_code} - {resp.json()}")

# 3. Check Notification (Client View)
print(f"\n--- 3. Checking Notifications for {target_user} ---")
notifs = requests.get(f"{BASE_URL}/notifications/{target_user}").json()
print(f"Found {len(notifs)} notifications for {target_user}.")
found = False
for n in notifs:
    print(f"- {n['message']} ({n['timestamp']})")
    if n['message'] == msg:
        found = True

if found:
    print("\nSUCCESS: Notification flow verified.")
else:
    print("\nFAILURE: Notification not found.")
