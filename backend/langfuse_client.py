import os
try:
    from langfuse import Langfuse
except ImportError:
    Langfuse = None

# Initialize Langfuse if key exists
public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
secret_key = os.getenv("LANGFUSE_SECRET_KEY")

langfuse = None
if public_key and secret_key and Langfuse:
    langfuse = Langfuse(
        public_key=public_key,
        secret_key=secret_key,
        host="https://cloud.langfuse.com"
    )

def trace_interaction(name, input_data):
    if langfuse:
        return langfuse.trace(name=name, input=input_data)
    return None
