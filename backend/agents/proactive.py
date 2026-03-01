from datetime import datetime, timedelta
import database
import langfuse_client

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
