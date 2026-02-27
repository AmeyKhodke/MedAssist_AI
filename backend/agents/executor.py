from datetime import datetime
import database
import langfuse_client

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
                database.update_stock(med_name, qty)
                
                # Record Order
                database.create_order(user_id, med_name, qty, price)
                
                dispatched_items.append(item)
                
            conn.close()
            
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
