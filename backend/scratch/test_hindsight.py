import os
from dotenv import load_dotenv
load_dotenv()

from config import Config
from hindsight_client import Hindsight

client = Hindsight(
    api_key=os.getenv("HINDSIGHT_API_KEY"),
    base_url=os.getenv("HINDSIGHT_BASE_URL")
)

try:
    # Use a dummy bank_id or the one from .env
    bank_id = os.getenv("HINDSIGHT_BANK_ID", "1")
    print(f"Testing recall on bank: {bank_id}")
    res = client.recall(bank_id=bank_id, query="test")
    print(f"Response type: {type(res)}")
    print(f"Response attributes: {dir(res)}")
    if hasattr(res, 'results'):
        print(f"Results type: {type(res.results)}")
        if res.results:
            print(f"First result type: {type(res.results[0])}")
            print(f"First result attributes: {dir(res.results[0])}")
except Exception as e:
    print(f"Error: {e}")
