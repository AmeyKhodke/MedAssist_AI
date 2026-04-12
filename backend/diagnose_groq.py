import os
from dotenv import load_dotenv

print("Loading .env...")
load_dotenv(override=True)

groq_key = os.getenv("GROQ_API_KEY")
print(f"GROQ_API_KEY found: {'Yes' if groq_key else 'No'}")
if groq_key:
    print(f"GROQ_API_KEY starts with: {groq_key[:10]}...")
    print(f"GROQ_API_KEY length: {len(groq_key)}")

try:
    from groq import Groq
    print("Groq package: AVAILABLE")
    if groq_key:
        try:
            client = Groq(api_key=groq_key)
            print("Groq client: INITIALIZED SUCCESSFULLY")
        except Exception as e:
            print(f"Groq client initialization: FAILED ({e})")
except ImportError:
    print("Groq package: MISSING")
