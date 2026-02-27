import sys
sys.path.insert(0, '.')
import agents

print("Output from agents.py:", agents.safety.run({"medicines": [{"name": "Cystinol akut\u00ae", "qty": 1}]}, "USER_123"))
