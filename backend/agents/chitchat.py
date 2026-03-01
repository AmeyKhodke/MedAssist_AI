import json
import re
import os
import langfuse_client

class ChitchatAgent:
    def __init__(self):
        self.responses = {}
        self.load_responses()

    def load_responses(self):
        try:
            # We want to load responses.json from the parent directory (backend) as it was originally
            # agents.py was in backend/. Now we are in backend/agents/.
            path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "responses.json")
            if os.path.exists(path):
                with open(path, 'r') as f:
                    self.responses = json.load(f)
        except Exception as e:
            print(f"Error loading responses: {e}")

    def run(self, text: str, user_id: str = "GUEST"):
        trace = langfuse_client.trace_interaction("ChitchatAgent", text, user_id=user_id)
        
        text_lower = text.lower()
        
        # Reload every time? For now, yes, to allow "training" without restart
        self.load_responses() 

        result_response = None
        for key, data in self.responses.items():
            for keyword in data.get("keywords", []):
                # Use regex for whole word match
                if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', text_lower):
                    result_response = data["response"]
                    break
            if result_response:
                break
        
        if trace:
            trace.update(output={"response": result_response})
            trace.end()
            
        return result_response
