import agents.extractor
import os
from dotenv import load_dotenv

load_dotenv()

agent = agents.extractor.OrderExtractorAgent()
res = agent.run("Want to order paracetmol", user_id="PAT037")
print(f"Result: {res}")
