import json
import re
from datetime import datetime, timedelta
import pandas as pd
import database
import langfuse_client

# Load medicines for name matching
def get_medicine_names():
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
                
                # Match "20 <med>"
                # Use word boundaries to avoid partial matches on short names?
                # But names are long. Let's stick to simple flexible matching.
                
                # Try finding number near the medicine name
                # "20 Ramipril", "Ramipril 20mg", "Ramipril 20"
                
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
                         # If it's like "Ramipril 10mg", that's strength not qty. 
                         # Heuristic: if number is 10, 20, 500 etc, assume strength if "mg" present or implied?
                         # For this hackathon, let's assume if user says "Ramipril 2" they mean 2 packs.
                         val = int(match_next.group(1))
                         if val < 10: # Simple heuristic: < 10 is likely quantity. > 10 might be mg.
                             qty = val
                         else:
                             # usage: "Ibuprofen 400" -> 400mg. Qty 1.
                             # usage: "Ibuprofen 20" -> 20mg? or 20 packs?
                             # Let's assume < 10 is Qty. 
                             # If they explicitly say "20 packs", we'd need better NLP.
                             pass
                         
                    # More explicit intent: "2 x Ramipril"
                    match_x = re.search(r'(\d+)\s*x\s*' + re.escape(med), text_lower)
                    if match_x:
                        qty = int(match_x.group(1))

                # If "I need Ramipril" -> qty 1 (default)
                # If "I need 1 Ramipril" -> qty 1

                
                # Capitalize correctly
                med_proper = next((m['name'] for m in database.get_all_medicines() if m['name'].lower() == med), med.capitalize())
                
                found_meds.append({
                    "name": med_proper,
                    "qty": qty
                })
        
        # ... (previous code) ...
        
        result = {"medicines": found_meds, "user_id": None, "suggestions": []}
        
        # If no medicines found, try to find suggestions
        if not found_meds:
            # Remove common stop words
            stop_words = {"i", "need", "want", "order", "buy", "please", "some", "a", "an", "the", "hi", "hello", "medicine", "medication", "product", "confirm"}
            words = [w for w in re.split(r'\W+', text_lower) if w and w not in stop_words and len(w) > 2]
            
            potential_matches = []
            for word in words:
                # Check if this word is a substring of any medicine
                # This can be slow if list is huge, but for 10k items it's fine for a hackathon
                for med in self.medicine_names:
                    if word in med:
                        # Found a partial match
                        # Get proper name
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

class SafetyCheckerAgent:
    def run(self, order_data, user_id="GUEST"):
        trace = langfuse_client.trace_interaction("SafetyChecker", order_data, user_id=user_id)
        
        mds = order_data.get("medicines", [])
        if not mds:
            result = {"approved": False, "reason": "No medicines found"}
            if trace: trace.end()
            return result
            
        conn = database.get_db_connection()
        
        for item in mds:
            med_name = item["name"]
            qty = item["qty"]
            
            row = conn.execute("SELECT * FROM medicines WHERE name = ?", (med_name,)).fetchone()
            if not row:
                conn.close()
                result = {"approved": False, "reason": f"Medicine {med_name} not found"}
                if trace: trace.end()
                return result
            
            # Stock Check
            if row['stock'] < qty:
                conn.close()
                result = {"approved": False, "reason": f"Insufficient stock for {med_name}. Available: {row['stock']}"}
                if trace: trace.end()
                return result
            
            # Prescription Check
            if row['prescription_required']:
                # 1. Does the user already have an active approval?
                is_approved = database.check_approved_prescription(user_id, med_name)
                if is_approved:
                    continue # Bypass check
                    
                # 2. Force Admin Approval (Safety Protocol)
                database.create_prescription_approval(user_id, med_name, "pending_script_upload")
                conn.close()
                result = {
                    "approved": False, 
                    "reason": f"This medication requires a prescription. I have sent your request to our pharmacist for approval.", 
                    "status": "needs_prescription"
                }
                if trace: trace.end()
                return result
        
        conn.close()
        result = {"approved": True, "reason": "Safety checks passed", "medicines": mds}
        if trace:
             trace.update(output=result)
             trace.end()
        return result

class InventoryExecutorAgent:
    def run(self, approved_order, user_id="GUEST"):
        trace = langfuse_client.trace_interaction("InventoryExecutor", approved_order, user_id=user_id)
        
        medicines = approved_order.get("medicines", [])
        total_price = 0
        conn = database.get_db_connection()
        
        dispatched_items = []
        
        try:
            for item in medicines:
                med_name = item["name"]
                qty = item["qty"]
                
                # Calculate price
                row = conn.execute("SELECT unit_price FROM medicines WHERE name = ?", (med_name,)).fetchone()
                price = row['unit_price'] * qty
                total_price += price
                
                # Deduct Stock
                database.update_stock(med_name, qty) # Helper already manages connection, but let's be careful with transactions
                
                # Record Order
                database.create_order(user_id, med_name, qty, price)
                
                dispatched_items.append(item)
                
            conn.close()
            
            # Webhook trigger (Mock)
            # requests.post(...)
            
            result = {
                "status": "success",
                "order_id": f"ORD-{int(datetime.now().timestamp())}",
                "total_price": total_price,
                "items": dispatched_items
            }
            if trace:
                 trace.update(output=result)
                 trace.end()
            return result
            
        except Exception as e:
            result = {"status": "failed", "error": str(e)}
            if trace:
                 trace.update(output=result, level="ERROR", status_message=str(e))
                 trace.end()
            return result

class ProactiveRefillAgent:
    def run_scan(self, user_id="ADMIN"):
        trace = langfuse_client.trace_interaction("ProactiveRefill", {}, user_id=user_id)
        
        conn = database.get_db_connection()
        customers = conn.execute("SELECT * FROM customers").fetchall()
        alerts = []
        
        today = datetime.now()
        
        for cust in customers:
            last_date_str = cust['last_purchase_date']
            last_qty = cust['last_quantity']
            dosage = cust['dosage_frequency'] # 'daily', 'weekly'
            
            if not last_date_str:
                continue
                
            try:
                # Try full timestamp first
                last_date = datetime.strptime(last_date_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    # Try date only
                    last_date = datetime.strptime(last_date_str, "%Y-%m-%d")
                except ValueError:
                    continue
            
            # Calculate days supply
            days_supply = 0
            if dosage == 'daily':
                days_supply = last_qty # 1 per day
            elif dosage == 'weekly':
                days_supply = last_qty * 7
            else:
                days_supply = last_qty # Default assumption
                
            expiry_date = last_date + timedelta(days=days_supply)
            days_until_refill = (expiry_date - today).days
            
            # Logic: Alert if running low (< 5 days left)
            if days_until_refill <= 5:
                # Verify we aren't suggesting too early?
                msg = f"Refill due in {days_until_refill} days"
                if days_until_refill < 0:
                     msg = f"Overdue by {abs(days_until_refill)} days"
                elif days_until_refill == 0:
                     msg = "Refill due today"
                     
                alerts.append({
                    "user_id": cust['user_id'],
                    "name": cust['name'],
                    "medicine": cust['medicine'],
                    "days_remaining": days_until_refill,
                    "message": msg
                })
        
        conn.close()
        if trace:
             trace.update(output=alerts)
             trace.end()
        return alerts

class ChitchatAgent:
    def __init__(self):
        self.responses = {}
        self.load_responses()

    def load_responses(self):
        try:
            import os
            path = os.path.join(os.path.dirname(__file__), "responses.json")
            if os.path.exists(path):
                with open(path, 'r') as f:
                    self.responses = json.load(f)
        except Exception as e:
            print(f"Error loading responses: {e}")

    def run(self, text: str):
        text_lower = text.lower()
        
        # Reload every time? For now, yes, to allow "training" without restart
        # In production this would be cached and reloaded on signal
        self.load_responses() 

        for key, data in self.responses.items():
            for keyword in data.get("keywords", []):
                # Use regex for whole word match to avoid "shipping" matching "hi"
                # Escape keyword just in case
                if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', text_lower):
                    return data["response"]
        
        return None

# Initialize Agents
extractor = OrderExtractorAgent()
safety = SafetyCheckerAgent()
executor = InventoryExecutorAgent()
proactive = ProactiveRefillAgent()
chitchat = ChitchatAgent()
