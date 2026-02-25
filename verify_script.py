import urllib.request
import json
import backend.database as db

def check_meds():
    conn = db.get_db_connection()
    meds = conn.execute("SELECT name FROM medicines WHERE prescription_required=1 LIMIT 1").fetchone()
    conn.close()
    if meds:
        name = meds['name']
        print(f"Testing with: {name}")
        req = urllib.request.Request(
            'http://localhost:8000/agent/chat', 
            data=json.dumps({'text': f'1 {name}', 'user_id': 'test_user_verify', 'prescription_verified': False}).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req)
        print("Without prescription:", res.read().decode('utf-8'))
        
        req = urllib.request.Request(
            'http://localhost:8000/agent/chat', 
            data=json.dumps({'text': f'1 {name}', 'user_id': 'test_user_verify', 'prescription_verified': True}).encode('utf-8'), 
            headers={'Content-Type': 'application/json'}
        )
        res = urllib.request.urlopen(req)
        print("With prescription:", res.read().decode('utf-8'))
        
        # Test admin endpoints
        req = urllib.request.Request('http://localhost:8000/admin/approvals')
        res = urllib.request.urlopen(req)
        print("Admin approvals:", res.read().decode('utf-8'))

check_meds()
