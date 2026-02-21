import re
import unittest

class TestExtraction(unittest.TestCase):
    def test_regex_escape(self):
        med = "cystinol akut®"
        text = "i need cystinol akut® 4"
        
        # Current logic mimic
        # Match "<med> 4"
        pattern = re.escape(med) + r'\s+(?:mg\s+)?(\d+)'
        match = re.search(pattern, text)
        
        print(f"Pattern: {pattern}")
        if match:
            print(f"Matched: {match.group(1)}")
        else:
            print("No match")
            
    def test_extraction_logic(self):
        # Simulating the loop in agents.py
        text_lower = "cystinol akut® 4"
        med = "cystinol akut®"
        
        qty = 1
        
        # Check for "X <med>" pattern
        match_prev = re.search(r'(\d+)\s+(?:mg\s+)?' + re.escape(med), text_lower)
        if match_prev:
            qty = int(match_prev.group(1))
        else:
            # Check for "<med> X" pattern
            match_next = re.search(re.escape(med) + r'\s+(?:mg\s+)?(\d+)', text_lower)
            if match_next:
                 qty = int(match_next.group(1))
                 
            # More explicit intent: "2 x Ramipril"
            match_x = re.search(r'(\d+)\s*x\s*' + re.escape(med), text_lower)
            if match_x:
                qty = int(match_x.group(1))
                
        print(f"Qty Result: {qty}")

if __name__ == "__main__":
    t = TestExtraction()
    t.test_regex_escape()
    t.test_extraction_logic()
