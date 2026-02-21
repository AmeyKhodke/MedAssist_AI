import agents
import sys

# Pick a prescription medicine
rx_med = "Ramipril"
text = f"I need 1 {rx_med}"

print(f"--- Scenario 1: Ordering {rx_med} WITHOUT Rx ---")
extraction = agents.extractor.run(text)
# Force approved=False for Rx
extraction["prescription_verified"] = False
safety = agents.safety.run(extraction)
print(f"Approved: {safety['approved']}")
print(f"Reason: {safety.get('reason')}")

print(f"\n--- Scenario 2: Ordering {rx_med} WITH Rx ---")
extraction["prescription_verified"] = True
safety = agents.safety.run(extraction)
print(f"Approved: {safety['approved']}")
if safety['approved']:
    print("Order would be executed.")
else:
    print(f"Reason: {safety.get('reason')}")
