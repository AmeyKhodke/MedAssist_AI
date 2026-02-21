import agents
import database

# Force load names
print("Loading names...")
names = agents.extractor.medicine_names
print(f"Loaded {len(names)} medicine names.")

# Pick a medicine from DB
conn = database.get_db_connection()
med = conn.execute("SELECT name FROM medicines LIMIT 1").fetchone()['name']
conn.close()

print(f"Testing with medicine: '{med}'")
text = f"I would like to order 2 {med}"
print(f"Input text: {text}")

extraction = agents.extractor.run(text)
print("Extraction result:", extraction)

if extraction['medicines']:
    print("SUCCESS: Medicine found.")
else:
    print("FAILURE: Medicine not found.")
