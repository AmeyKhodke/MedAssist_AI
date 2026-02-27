import agents
import database

# Pick a prescription medicine
rx_med = "Ramipril - 1 A Pharma® 10 mg Tabletten"
text = f"I need 1 {rx_med}"

print(f"--- Scenario 1: Ordering '{rx_med}' WITHOUT prescription ---")
# 1. Extract
extraction = agents.extractor.run(text)
print("Extraction:", extraction)

# 2. Safety Check (No Rx verified)
extraction["prescription_verified"] = False
safety = agents.safety.run(extraction)
print("Safety Result:", safety)

if not safety["approved"]:
    print(f"Outcome: BLOCKED. Reason: {safety['reason']}")
else:
    print("Outcome: ALLOWED (Unexpected)")

print(f"\n--- Scenario 2: Ordering '{rx_med}' WITH prescription ---")
# 3. Safety Check (Rx verified)
extraction["prescription_verified"] = True
safety = agents.safety.run(extraction)
print("Safety Result:", safety)

if safety["approved"]:
    print("Outcome: APPROVED. Proceeding to execution...")
    # Execute
    execution = agents.executor.run(safety, "TEST_USER")
    print("Execution Result:", execution)
else:
    print(f"Outcome: BLOCKED. Reason: {safety['reason']}")
