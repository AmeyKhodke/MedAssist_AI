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
