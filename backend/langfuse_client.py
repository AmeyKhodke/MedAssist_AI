import os
from dotenv import load_dotenv

load_dotenv()

try:
    from langfuse import Langfuse
except ImportError:
    Langfuse = None

# Initialize Langfuse if key exists
public_key = os.environ.get("LANGFUSE_PUBLIC_KEY")
secret_key = os.environ.get("LANGFUSE_SECRET_KEY")

langfuse = None
if public_key and secret_key and Langfuse:
    langfuse = Langfuse(
        public_key=public_key,
        secret_key=secret_key,
        host="https://cloud.langfuse.com"
    )

def trace_interaction(name, input_data, user_id=None):
    if langfuse:
        span = langfuse.start_span(name=name, input=input_data)
        if user_id:
            span.update_trace(user_id=user_id)
        return span
    return None

def flush():
    if langfuse:
        langfuse.flush()
