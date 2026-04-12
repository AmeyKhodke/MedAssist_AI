import database
import langfuse_client

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
            med_name = item.get("name")
            if not med_name:
                continue
            
            qty = item.get("qty", item.get("quantity", 1))
            try:
                qty = int(qty)
            except ValueError:
                qty = 1
            item["qty"] = qty # ensure it's set for executor
            
            row = conn.execute("SELECT * FROM medicines WHERE name = ?", (med_name,)).fetchone()
            if not row:
                conn.close()
                result = {"approved": False, "reason": f"Medicine {med_name} not found"}
                if trace: trace.end()
                return result
            
            # Stock Check
            if row['stock'] < qty:
                # Create a restock request for the admin
                database.create_restock_request(user_id, med_name, qty, row['stock'])
                # Notify the admin
                database.create_notification("ADMIN", f"URGENT RESTOCK: Patient ({user_id}) requested {qty}x {med_name}, but only {row['stock']} are in stock.")
                
                conn.close()
                result = {
                    "approved": False, 
                    "reason": f"Insufficient stock for {med_name}. A restock request has been automatically sent to the pharmacy admin. You will be notified when it is available!",
                    "status": "pending_restock"
                }
                if trace: trace.end()
                return result
            
            # Prescription Check
            if row['prescription_required']:
                is_approved = database.check_approved_prescription(user_id, med_name)
                if is_approved:
                    continue # Bypass check
                    
                if order_data.get("prescription_verified", False):
                    database.create_prescription_approval(user_id, med_name, "mock_url_or_verified")
                    conn.close()
                    result = {
                        "approved": False, 
                        "reason": f"Your prescription for {med_name} is pending admin approval. We will notify you once reviewed.", 
                        "status": "pending_admin"
                    }
                    if trace: trace.end()
                    return result
                else:
                    conn.close()
                    result = {
                        "approved": False, 
                        "reason": f"Prescription required for {med_name}. Please upload your prescription.", 
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
