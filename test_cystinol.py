import urllib.request
import json
import sys

def test_chat():
    req = urllib.request.Request(
        'http://localhost:8000/agent/chat', 
        data=json.dumps({'text': 'Order 1 Cystinol akut®', 'user_id': 'USER_123', 'prescription_verified': False}).encode(), 
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    print("CHAT RESPONSE:", res.read().decode())

def test_cart_checkout():
    # 1. Add to cart
    print("Adding to cart via API...")
    req = urllib.request.Request(
        'http://localhost:8000/agent/chat', 
        data=json.dumps({'text': 'yes', 'user_id': 'USER_123'}).encode(), 
        headers={'Content-Type': 'application/json'}
    )
    try:
        res = urllib.request.urlopen(req)
        print("CONFIRM RESPONSE:", res.read().decode())
    except Exception as e:
        print("ERROR:", e)

if __name__ == "__main__":
    test_chat()
    test_cart_checkout()
