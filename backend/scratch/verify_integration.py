import os
from dotenv import load_dotenv
load_dotenv(override=True)

from agents.extractor import OrderExtractorAgent
from config import Config

def test_integration():
    print(f"Using BANK_ID: {Config.HINDSIGHT_BANK_ID}")
    agent = OrderExtractorAgent()
    user_id = "test_user_123"
    
    # 1. Retain an order
    print("\n--- Step 1: Retaining Order ---")
    order_text = "I want to buy 10 Paracetamol 500mg tablets"
    result = agent.run(order_text, user_id=user_id)
    print(f"Agent response: {result.get('answer')}")
    print(f"Extracted Medicines: {result.get('medicines')}")
    
    # 2. Recall memory in a follow-up
    print("\n--- Step 2: Recalling Order ---")
    query_text = "What did I just order?"
    result = agent.run(query_text, user_id=user_id)
    print(f"Agent response: {result.get('answer')}")
    
if __name__ == "__main__":
    test_integration()
