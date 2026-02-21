# 🏥 Autonomous Pharmacy Agent Ecosystem v2.0

> **Judges**: This system demonstrates a fully agentic pharmacy capable of voice interaction, safety enforcement, and proactive refill management.

## 🌟 Key Features
- **🗣️ Voice & Text Interface**: Speak "I need 10 Paracetamol" and watch it execute.
- **🛡️ Autonomous Safety Agents**: Automatically rejects prescription meds without verification and prevents stock depletion.
- **🧠 Proactive Refills**: Analyzes customer history to predict and alert re-stocking needs (CRON agent).
- **📊 Live Observability**: Full Langfuse integration for agent thought traces.

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start Backend (Port 8000)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app:app --reload
```

### 2. Start Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 3. Access Application
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🧪 Demo Scenarios to Try

1. **Simple Order (Success)**
   - Speak/Type: "I need 10 Paracetamol tablets"
   - Result: Agent checks stock -> Deducts -> Confirms order.

2. **Safety Check (Rejection)**
   - Speak/Type: "Give me 5 Amoxicillin"
   - Result: "I cannot process this order. Prescription required."
   - Fix: Toggle "[DEBUG] Mock Upload Rx" then try again.

3. **Proactive Alerts (Admin Panel)**
   - Switch to **Admin Panel**.
   - Observe "Refill Alert" for customers running low based on history.

## 🔍 Observability
All agent thoughts are traced in Langfuse.
**[Public Trace Link](https://cloud.langfuse.com/project/...)** (Replace with actual link if available)

## 📂 Project Structure
- `backend/agents.py`: The brain (OrderExtractor, SafetyChecker, InventoryExecutor).
- `backend/data/`: `medicines.csv` (Source of Truth).
- `frontend/src/App.jsx`: React + Tailwind + WebSpeech API.

---
*Built with ❤️ by Antigravity for Agentic Hackathon*
