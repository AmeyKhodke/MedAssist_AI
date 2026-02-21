import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'd:\\Hackathon\\pharmacy-agent\\backend'))

from agents import OrderExtractorAgent, database

# Mock database.get_all_medicines to avoid DB connection issues if any, 
# but actually we want real DB to match exactly what happens.
# The agent loads from DB.

def test():
    agent = OrderExtractorAgent()
    
    # Test case from user
    text = "Cystinol akut® 4"
    print(f"--- Testing: '{text}' ---")
    
    result = agent.run(text)
    print("Result:", result)

if __name__ == "__main__":
    test()
