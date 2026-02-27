import re
from typing import Dict, List, Any
import database
import langfuse_client

def get_medicine_names() -> List[str]:
    conn = database.get_db_connection()
    meds = conn.execute("SELECT name FROM medicines").fetchall()
    conn.close()
    return [m['name'].lower() for m in meds]

class OrderExtractorAgent:
    def __init__(self):
        self._medicine_names = None

    @property
    def medicine_names(self):
        if self._medicine_names is None:
            # Check if table exists first to avoid crash during early init
            try:
                self._medicine_names = get_medicine_names()
            except:
                return []
        return self._medicine_names

    def run(self, text: str, user_id: str = "GUEST"):
        # Langfuse trace
        trace = langfuse_client.trace_interaction("OrderExtractor", text, user_id=user_id)
        
        # Ensure names are loaded (now that DB should be ready)
        if not self.medicine_names:
             try:
                self._medicine_names = get_medicine_names()
             except:
                pass
        
        # Simple heuristic/regex extraction for demo stability
        # "20 metformin" -> qty=20, name=metformin
        # Improve this with LLM if available
        
        found_meds = []
        text_lower = text.lower()
        
        for med in self.medicine_names:
            if med in text_lower:
                # Look for number before "med" or generic number in string
                # Regex for "20 med" or "med 20"
                qty = 1 # Default
                
                # Check for "X <med>" pattern
                match_prev = re.search(r'(\d+)\s+(?:mg\s+)?' + re.escape(med), text_lower)
                if match_prev:
                    qty = int(match_prev.group(1))
                else:
                    # Check for "<med> X" pattern
                    pattern_next = re.escape(med) + r'\s+(?:mg\s+)?(\d+)'
                    match_next = re.search(pattern_next, text_lower)
                    
                    if match_next:
                         val = int(match_next.group(1))
                         if val < 10: # Simple heuristic: < 10 is likely quantity. > 10 might be mg.
                             qty = val
                    
                    # More explicit intent: "2 x Ramipril"
                    match_x = re.search(r'(\d+)\s*x\s*' + re.escape(med), text_lower)
                    if match_x:
                        qty = int(match_x.group(1))

                # Capitalize correctly
                med_proper = next((m['name'] for m in database.get_all_medicines() if m['name'].lower() == med), med.capitalize())
                
                found_meds.append({
                    "name": med_proper,
                    "qty": qty
                })
        
        result = {"medicines": found_meds, "user_id": None, "suggestions": []}
        
        # If no medicines found, try to find suggestions
        if not found_meds:
            # Remove common stop words
            stop_words = {"i", "need", "want", "order", "buy", "please", "some", "a", "an", "the", "hi", "hello", "medicine", "medication", "product", "confirm"}
            words = [w for w in re.split(r'\W+', text_lower) if w and w not in stop_words and len(w) > 2]
            
            potential_matches = []
            for word in words:
                for med in self.medicine_names:
                    if word in med:
                        med_proper = next((m['name'] for m in database.get_all_medicines() if m['name'].lower() == med), med.capitalize())
                        if med_proper not in potential_matches:
                            potential_matches.append(med_proper)
                        if len(potential_matches) >= 5: break # Limit
                if len(potential_matches) >= 5: break
            
            result["suggestions"] = potential_matches

        # Update trace
        if trace:
             trace.update(output=result)
             
        return result
