

<h1 align="center">MedAssist AI</h1>

<p align="center">
  <strong>An Intelligent Pharmacy Concierge Powered by Memory-Driven AI Agents</strong>
</p>

<p align="center">
  <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/></a>
  <a href="https://groq.com/"><img src="https://img.shields.io/badge/LLM-Groq-F55036?style=for-the-badge&logo=groq&logoColor=white" alt="Groq"/></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Vision-Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini"/></a>
  <a href="https://www.python.org/"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/></a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Frontend Setup](#2-frontend-setup)
  - [Docker Setup](#3-docker-setup-optional)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [AI Agent Pipeline](#-ai-agent-pipeline)
- [Hindsight Memory Engine](#-hindsight-memory-engine)
- [Screenshots](#-screenshots)
- [Future Roadmap](#-future-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## 🧠 About

**MedAssist AI** is a full-stack, AI-powered pharmacy management system that combines a conversational patient-facing chatbot with a rich analytics-driven admin dashboard. Built for the **Hack With Chennai 2026** hackathon, it tackles the fragmented nature of traditional pharmacy workflows.

### The Problem

- **Patients** manually track prescriptions, forget refill dates, and repeat medical history every visit.
- **Pharmacists** juggle inventory, verify prescriptions manually, and lack proactive patient outreach tools.
- **Language barriers** in multilingual countries make healthcare communication harder.

### The Solution

MedAssist AI unifies ordering, inventory management, prescription verification, and patient care into a single intelligent platform—powered by a **Hindsight™ Memory Engine** that remembers each patient across sessions.

---

## ✨ Features

### 🩺 Patient-Facing Features

| Feature | Description |
|---------|-------------|
| **AI Chat Concierge** | Natural language medicine ordering — _"I need 2 strips of Paracetamol"_ |
| **Prescription Upload** | Upload prescription images/PDFs — AI extracts medicines via [Google Gemini](https://ai.google.dev/) vision |
| **Smart Cart** | Add, view, and checkout cart items via conversation or UI buttons |
| **Order History** | Full history of all fulfilled orders with timestamps and pricing |
| **Health Alerts** | Proactive refill reminders when the AI detects low supply based on purchase patterns |
| **Health Profile** | View patient verification status, active prescriptions, and memory stats |
| **Multilingual Support** | Chat in Hindi, Tamil, Marathi, or any Indian language via [Sarvam AI](https://www.sarvam.ai/) translation |
| **One-Click Refill** | Refill previously ordered medicines with a single click from alerts |

### 🏥 Admin Features

| Feature | Description |
|---------|-------------|
| **Command Center Dashboard** | Real-time KPIs — revenue, profit, patient count, inventory stats |
| **Sales Analytics** | Interactive charts with configurable time filters (day/week/month/year) |
| **Inventory Management** | Full CRUD with stock levels, pricing, categories, and visual charts |
| **Prescription Approvals** | Review uploaded prescriptions, approve/reject with one click |
| **Patient Management** | View all patients, their order history, and memory profiles |
| **Refill Predictions** | AI-generated predictions with confidence scores and risk indicators |
| **Restock Requests** | Auto-generated restock alerts when orders fail due to low stock |
| **Settings Panel** | System configuration and pharmacy profile management |

### 🤖 AI & Intelligence

| Feature | Description |
|---------|-------------|
| **Multi-Agent Pipeline** | 5 specialized agents (Extractor, Safety, Executor, Proactive, Chitchat) |
| **Hindsight™ Memory** | Per-user long-term memory that learns preferences, conditions, and patterns |
| **Fuzzy Medicine Matching** | Handles typos and partial names with `LIKE`-based fallback queries |
| **Drug Safety Checks** | Validates prescription requirements and stock before executing orders |
| **Observability** | Full AI interaction tracing via [Langfuse](https://langfuse.com/) |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │  Login Page   │  │ Client       │  │ Admin Dashboard      │ │
│   │  (Auth)       │  │ Dashboard    │  │ (Command Center)     │ │
│   │              │  │  • AI Chat   │  │  • Sales Analytics   │ │
│   │  • Register  │  │  • Orders    │  │  • Inventory CRUD    │ │
│   │  • Login     │  │  • Cart      │  │  • Prescriptions     │ │
│   │  • Role Gate │  │  • Alerts    │  │  • Patients          │ │
│   └──────────────┘  │  • Profile   │  │  • Alerts & Restocks │ │
│                     └──────────────┘  └──────────────────────┘ │
│                              │                                  │
│                    Axios + JWT Bearer Token                      │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   FastAPI Backend    │
                    │   (Port 8000)        │
                    ├─────────────────────┤
                    │  Authentication     │──── JWT (python-jose)
                    │  REST API Routes    │
                    │  Agent Orchestrator │
                    ├─────────────────────┤
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ AI Agents     │  │
                    │  │               │  │
                    │  │ • Extractor   │──┼──── Groq LLM API
                    │  │ • Safety      │  │
                    │  │ • Executor    │  │
                    │  │ • Proactive   │  │
                    │  │ • Chitchat    │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Memory Engine │──┼──── Hindsight API (optional)
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Sarvam        │──┼──── Sarvam AI Translation API
                    │  │ Service       │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Prescription  │──┼──── Google Gemini Vision API
                    │  │ OCR           │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ Langfuse      │──┼──── Langfuse Cloud (Observability)
                    │  │ Client        │  │
                    │  └───────────────┘  │
                    │                     │
                    ├─────────────────────┤
                    │  SQLite Database    │
                    │  (pharmacy.db)      │
                    │                     │
                    │  Tables:            │
                    │  • medicines        │
                    │  • customers        │
                    │  • orders           │
                    │  • cart_items       │
                    │  • prescriptions    │
                    │  • notifications    │
                    │  • user_memories    │
                    │  • chat_messages    │
                    │  • restock_requests │
                    └─────────────────────┘
```

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose | Link |
|-----------|---------|---------|------|
| React | 19.2 | UI library | [react.dev](https://react.dev/) |
| Vite | 7.2 | Build tool & dev server | [vitejs.dev](https://vitejs.dev/) |
| TailwindCSS | 3.4 | Utility-first CSS framework | [tailwindcss.com](https://tailwindcss.com/) |
| Framer Motion | 12.x | Animation library | [framer.com/motion](https://www.framer.com/motion/) |
| Recharts | 2.15 | Charting library | [recharts.org](https://recharts.org/) |
| Lucide React | 0.563 | Icon library | [lucide.dev](https://lucide.dev/) |
| Axios | 1.13 | HTTP client | [axios-http.com](https://axios-http.com/) |
| React Hot Toast | 2.6 | Toast notifications | [react-hot-toast.com](https://react-hot-toast.com/) |

### Backend

| Technology | Version | Purpose | Link |
|-----------|---------|---------|------|
| Python | 3.11+ | Runtime | [python.org](https://www.python.org/) |
| FastAPI | 0.133 | Web framework | [fastapi.tiangolo.com](https://fastapi.tiangolo.com/) |
| Uvicorn | 0.41 | ASGI server | [uvicorn.org](https://www.uvicorn.org/) |
| SQLite | 3.x | Database | [sqlite.org](https://www.sqlite.org/) |
| python-jose | 3.5 | JWT authentication | [PyPI](https://pypi.org/project/python-jose/) |
| bcrypt | 5.0 | Password hashing | [PyPI](https://pypi.org/project/bcrypt/) |
| Pydantic | 2.x | Data validation | [docs.pydantic.dev](https://docs.pydantic.dev/) |
| HTTPX | 0.28 | Async HTTP client | [python-httpx.org](https://www.python-httpx.org/) |

### AI & External Services

| Service | Purpose | Link |
|---------|---------|------|
| Groq | LLM inference (Llama/Mixtral) | [groq.com](https://groq.com/) |
| Google Gemini | Prescription OCR / Vision AI | [ai.google.dev](https://ai.google.dev/) |
| Sarvam AI | Multilingual translation | [sarvam.ai](https://www.sarvam.ai/) |
| Langfuse | AI observability & tracing | [langfuse.com](https://langfuse.com/) |
| Hindsight | Cloud memory persistence (optional) | [hindsight.vectorize.io](https://hindsight.vectorize.io/) |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm** or **yarn** — Comes with Node.js
- **Git** — [Download](https://git-scm.com/)

### 1. Backend Setup

```bash
# Clone the repository
git clone https://github.com/AmeyKhodke/MedAssist_AI.git
cd MedAssist_AI/backend

# Create and activate a virtual environment
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp sample.env .env
# Edit .env with your API keys (see Environment Variables section)

# Seed the admin user (first time only)
python seed_admin.py

# Start the backend server
uvicorn app:app --reload --port 8000
```

The backend will be available at: **http://localhost:8000**

API docs (Swagger UI): **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
# Open a new terminal
cd MedAssist_AI/frontend

# Install dependencies
npm install

# Set up environment variables (if needed)
# Create .env file with: VITE_API_BASE_URL=http://localhost:8000

# Start the development server
npm run dev
```

The frontend will be available at: **http://localhost:5173**

### 3. Docker Setup (Optional)

```bash
# From the project root
cd MedAssist_AI

# Build and run both services
docker-compose up --build
```

This will start:
- **Backend** on port `8000`
- **Frontend** on port `5173`

---

## 🔐 Environment Variables

Create a `.env` file in the `backend/` directory with the following:

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `GROQ_API_KEY` | ✅ Yes | Groq LLM API key for NLP processing | [console.groq.com](https://console.groq.com/) |
| `SECRET_KEY` | ✅ Yes | JWT secret — use a random 32+ char string | Generate locally |
| `ALGORITHM` | ✅ Yes | JWT algorithm (default: `HS256`) | Use `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ Yes | Token expiry in minutes (default: `1440`) | Set to `1440` (24h) |
| `GOOGLE_API_KEY` | ⚡ Recommended | Google Gemini API key for prescription OCR | [aistudio.google.com](https://aistudio.google.com/) |
| `SARVAM_API_KEY` | ⚡ Recommended | Sarvam AI key for multilingual translation | [sarvam.ai](https://www.sarvam.ai/) |
| `LANGFUSE_PUBLIC_KEY` | 🔧 Optional | Langfuse public key for observability | [langfuse.com](https://langfuse.com/) |
| `LANGFUSE_SECRET_KEY` | 🔧 Optional | Langfuse secret key | [langfuse.com](https://langfuse.com/) |
| `HINDSIGHT_API_KEY` | 🔧 Optional | Hindsight memory cloud sync | [hindsight.vectorize.io](https://hindsight.vectorize.io/) |
| `HINDSIGHT_BASE_URL` | 🔧 Optional | Hindsight API base URL | Default: `https://api.hindsight.vectorize.io` |
| `HINDSIGHT_BANK_ID` | 🔧 Optional | Hindsight memory bank ID | Default: `1` |

**Example `.env` file:**

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SECRET_KEY=my-super-secret-jwt-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx
SARVAM_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `POST` | `/auth/register` | Register a new patient account | ❌ |
| `POST` | `/auth/login` | Login and receive JWT token | ❌ |

### Patient Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `POST` | `/agent/chat` | Send a message to the AI concierge | ✅ |
| `POST` | `/agent/upload_prescription` | Upload a prescription image/PDF | ✅ |
| `GET` | `/agent/alerts` | Get proactive refill alerts | ✅ |
| `GET` | `/orders` | Get the patient's order history | ✅ |
| `GET` | `/cart` | Get current cart items | ✅ |
| `DELETE` | `/cart` | Clear the cart | ✅ |
| `POST` | `/cart/refill` | One-click refill a medicine | ✅ |
| `POST` | `/cart/checkout` | Checkout and place the order | ✅ |
| `GET` | `/chat/history` | Get chat history for a session | ✅ |
| `GET` | `/chat/sessions/{user_id}` | Get all chat sessions for a user | ✅ |
| `GET` | `/notifications/{user_id}` | Get patient notifications | ✅ |
| `GET` | `/medicines` | List all available medicines | ✅ |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:---:|
| `GET` | `/api/dashboard/summary` | Dashboard KPIs (revenue, patients, etc.) | ✅ |
| `GET` | `/api/sales/analytics` | Sales data for charts | ✅ |
| `GET` | `/api/inventory` | Inventory analytics | ✅ |
| `POST` | `/api/inventory/add` | Add a new medicine | ✅ |
| `GET` | `/api/approvals` | Get all prescription approvals | ✅ |
| `POST` | `/api/approvals/{id}` | Approve or reject a prescription | ✅ |
| `GET` | `/api/users` | List all registered patients | ✅ |
| `GET` | `/api/users/{id}` | Get a specific patient's details | ✅ |
| `GET` | `/api/refill/predictions` | AI-generated refill predictions | ✅ |
| `GET` | `/api/restocks` | Get pending restock requests | ✅ |
| `POST` | `/api/restocks/{id}/approve` | Approve a restock request | ✅ |
| `POST` | `/api/restocks/{id}/reject` | Reject a restock request | ✅ |

> 📖 **Interactive API docs** available at: `http://localhost:8000/docs` (Swagger UI)

---

## 📁 Project Structure

```
MedAssist_AI/
├── 📁 backend/
│   ├── 📁 agents/                  # AI Agent modules
│   │   ├── __init__.py             # Agent orchestration & Gemini prescription extractor
│   │   ├── extractor.py            # Order Extractor Agent (Groq LLM)
│   │   ├── safety.py               # Safety & Compliance Agent
│   │   ├── executor.py             # Order Executor Agent
│   │   ├── proactive.py            # Proactive Alerts Agent
│   │   └── chitchat.py             # Conversational Agent
│   ├── 📁 data/                    # Seed data files
│   ├── 📁 static/uploads/          # Uploaded prescription files
│   ├── app.py                      # FastAPI application & routes (main entry)
│   ├── database.py                 # SQLite database layer (all queries)
│   ├── memory_engine.py            # Hindsight™ Memory Engine
│   ├── sarvam_service.py           # Sarvam AI translation middleware
│   ├── langfuse_client.py          # Langfuse observability client
│   ├── config.py                   # App configuration (reads .env)
│   ├── models.py                   # Pydantic models
│   ├── seed_admin.py               # Admin user seeder script
│   ├── requirements.txt            # Python dependencies
│   └── .env                        # Environment variables (not committed)
│
├── 📁 frontend/
│   ├── 📁 public/                  # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── 📁 chat/            # Chat interface components
│   │   │   │   └── ChatInterface.jsx
│   │   │   ├── 📁 dashboard/       # Admin dashboard components
│   │   │   │   ├── DashboardSummary.jsx
│   │   │   │   ├── SalesChart.jsx
│   │   │   │   ├── InventoryCharts.jsx
│   │   │   │   ├── InventoryTable.jsx
│   │   │   │   ├── InventoryView.jsx
│   │   │   │   ├── PrescriptionsView.jsx
│   │   │   │   ├── PatientsView.jsx
│   │   │   │   ├── AlertsView.jsx
│   │   │   │   ├── SettingsView.jsx
│   │   │   │   └── ... (12 more components)
│   │   │   ├── 📁 layout/          # Sidebar & Topbar
│   │   │   └── VoiceChat.jsx       # Voice interface (scaffolded)
│   │   ├── App.jsx                 # Root component with auth routing
│   │   ├── LoginPage.jsx           # Authentication page (Login/Register)
│   │   ├── ClientDashboard.jsx     # Patient-side dashboard
│   │   ├── Admin.jsx               # Admin dashboard orchestrator
│   │   ├── api.js                  # Axios instance with JWT interceptor
│   │   ├── main.jsx                # React entry point
│   │   └── index.css               # Global styles & design tokens
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
│
├── docker-compose.yml              # Docker multi-service configuration
├── sample.env                      # Environment variables template
└── README.md                       # This file
```

---

## 🤖 AI Agent Pipeline

Every patient message passes through a sophisticated pipeline of specialized AI agents:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Extractor  │────▶│    Safety    │────▶│   Executor   │
│    Agent     │     │    Agent     │     │    Agent     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ • Parse NL   │     │ • Check Rx   │     │ • Deduct     │
│   to order   │     │   required   │     │   stock      │
│ • Fuzzy      │     │ • Validate   │     │ • Create     │
│   medicine   │     │   stock      │     │   order      │
│   matching   │     │ • Drug       │     │ • Update     │
│ • LLM-       │     │   safety     │     │   financials │
│   powered    │     │   rules      │     │ • Langfuse   │
│   Q&A        │     │              │     │   trace      │
└──────────────┘     └──────────────┘     └──────────────┘
        │
        │ (If no order detected)
        ▼
┌──────────────┐     ┌──────────────┐
│   Chitchat   │     │  Proactive   │
│    Agent     │     │    Agent     │
├──────────────┤     ├──────────────┤
│ • Greetings  │     │ • Refill     │
│ • Q&A        │     │   scanning   │
│ • Price      │     │ • Purchase   │
│   queries    │     │   pattern    │
│ • General    │     │   analysis   │
│   health     │     │ • Alert      │
│   chat       │     │   generation │
└──────────────┘     └──────────────┘
```

### Agent Details

| Agent | File | LLM Used | Purpose |
|-------|------|----------|---------|
| **Extractor** | `agents/extractor.py` | [Groq](https://groq.com/) (Llama/Mixtral) | Parses natural language into structured medicine orders with fuzzy inventory matching |
| **Safety** | `agents/safety.py` | Rule-based | Validates prescription requirements, stock availability, and drug safety compliance |
| **Executor** | `agents/executor.py` | Rule-based | Processes confirmed orders, deducts stock, records transactions |
| **Proactive** | `agents/proactive.py` | Rule-based | Scans purchase history to generate predictive refill alerts |
| **Chitchat** | `agents/chitchat.py` | [Groq](https://groq.com/) | Handles non-order conversations (greetings, questions, small talk) |

---

## 🧠 Hindsight™ Memory Engine — Solving AI Amnesia

### The Core Problem: AI Amnesia

Most AI chatbots today suffer from **total amnesia** — they forget everything once a session ends. In a pharmacy or healthcare setting, this creates a dangerous and frustrating experience:

> 💬 **Session 1:** Patient says _"I am allergic to penicillin"_ → AI acknowledges it.
>
> 💬 **Session 2:** Same patient asks _"Recommend something for my infection"_ → AI suggests a penicillin-based antibiotic because **it has completely forgotten the allergy**.

Every conversation starts from zero. The AI has no memory of past interactions, health conditions, preferences, or prescription history. This is not just inconvenient — in healthcare, **it can be dangerous**.

### Our Solution: Dual-Layer Persistent Memory

MedAssist AI solves this with a **dual-layer memory architecture** powered by [Hindsight](https://hindsight.vectorize.io/), separating the memory layer from the response generation layer:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MEMORY ARCHITECTURE                             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 LAYER 1: LOCAL MEMORY (SQLite)               │   │
│  │                                                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │   │
│  │  │ user_memories│  │ chat_messages│  │ prescription_       │ │   │
│  │  │             │  │             │  │ approvals           │ │   │
│  │  │ • Orders    │  │ • Session   │  │ • Doctor names      │ │   │
│  │  │ • Prefs     │  │   history   │  │ • Rx medicines      │ │   │
│  │  │ • Conditions│  │ • User msgs │  │ • Approval status   │ │   │
│  │  │ • Queries   │  │ • AI resps  │  │                     │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │   │
│  │                                                             │   │
│  │  Fast reads • Per-user isolation • Deduplication            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                     │
│                    Async sync (background thread)                   │
│                              ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │          LAYER 2: HINDSIGHT CLOUD (Long-Term Learning)      │   │
│  │                                                             │   │
│  │  • Cross-device memory persistence                          │   │
│  │  • AI-powered memory indexing & retrieval                   │   │
│  │  • Long-term pattern recognition                            │   │
│  │  • Scalable cloud storage per user bank                     │   │
│  │                                                             │   │
│  │  SDK: hindsight_client.Hindsight.retain()                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### How It Works — Step by Step

Here's the complete memory flow for a single patient interaction:

```
 Patient says: "I have diabetes and need Metformin"
                        │
                        ▼
 ┌──────────────────────────────────────┐
 │  1. STORE: Memory Engine extracts    │
 │     key facts from the message       │
 │                                      │
 │     → "User has diabetes"  (pref)    │
 │     → "Ordered Metformin"  (order)   │
 │     → Raw message stored   (general) │
 └──────────────┬───────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────┐
 │  2. LOCAL PERSIST: Facts written to  │
 │     SQLite `user_memories` table     │
 │     with deduplication check         │
 └──────────────┬───────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────┐
 │  3. CLOUD SYNC: Background thread    │
 │     pushes to Hindsight API via SDK  │
 │                                      │
 │     hindsight.retain(                │
 │       bank_id, content, metadata     │
 │     )                                │
 └──────────────────────────────────────┘

 ═══════════════════════════════════════
         --- NEXT SESSION ---
 ═══════════════════════════════════════

 Patient returns and asks: "Recommend something for my condition"
                        │
                        ▼
 ┌──────────────────────────────────────┐
 │  4. RETRIEVE: Before generating a    │
 │     response, the system fetches     │
 │     the patient's memory bank        │
 │                                      │
 │     → Long-term facts (15 latest)    │
 │     → Session history (12 turns)     │
 └──────────────┬───────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────┐
 │  5. INJECT: Memory context is added  │
 │     to the LLM system prompt         │
 │                                      │
 │     "=== LONG-TERM USER MEMORY ===   │
 │      [2026-04-12] User has diabetes  │
 │      [2026-04-12] Ordered Metformin" │
 └──────────────┬───────────────────────┘
                │
                ▼
 ┌──────────────────────────────────────┐
 │  6. RESPOND: AI generates a          │
 │     personalized, context-aware      │
 │     response                         │
 │                                      │
 │     "Based on your diabetes history, │
 │      I recommend continuing with     │
 │      Metformin 500mg..."             │
 └──────────────────────────────────────┘
```

### Why Hindsight?

[Hindsight](https://hindsight.vectorize.io/) is a cloud-based memory persistence API that enables AI agents to build **long-term user understanding** and improve over time.

| Feature | Local SQLite | Hindsight Cloud | Combined |
|---------|:---:|:---:|:---:|
| Fast local reads | ✅ | ❌ | ✅ |
| Cross-device persistence | ❌ | ✅ | ✅ |
| AI-powered retrieval | ❌ | ✅ | ✅ |
| Works offline | ✅ | ❌ | ✅ |
| Pattern learning over time | ❌ | ✅ | ✅ |
| Per-user data isolation | ✅ | ✅ | ✅ |

Instead of relying on massive context windows (which are expensive and hit token limits), MedAssist AI **dynamically injects only the most relevant memories** into the prompt. This makes the system:

- **More efficient** — Only relevant data is retrieved, not entire conversation histories
- **More scalable** — Memory is stored externally, not in the LLM context
- **More personalized** — The AI genuinely learns about each patient over time

### Hindsight Integration Code

The Hindsight SDK integration lives in `memory_engine.py`:

```python
from hindsight_client import Hindsight

def sync_to_hindsight(user_id, content, role="assistant", session_id="default", msg_type="chat"):
    """Push memory to Hindsight cloud in a background thread."""
    client = Hindsight(api_key=HINDSIGHT_API_KEY, base_url=HINDSIGHT_BASE_URL)
    client.retain(
        bank_id=BANK_ID,
        content=content,
        metadata={
            "user_id": user_id,
            "conversation_id": session_id,
            "role": role,
            "type": msg_type   # "chat" | "document" | "prescription"
        }
    )
```

Every interaction — chat messages, prescription uploads, order confirmations — is synced to Hindsight in a background thread so the user experience is never slowed down.

### What Gets Remembered

| Memory Type | Example | Trigger |
|-------------|---------|---------|
| `order` | _"Ordered 2x Metformin 500mg on 2026-04-12"_ | When a medicine is added to cart or order confirmed |
| `prescription` | _"Has a prescription from Dr. Sharma"_ | When a prescription is uploaded |
| `preference` | _"User prefers generic medicines"_ | When user mentions "generic", "cheap", "affordable" |
| `query` | _"Showed interest in Amoxicillin"_ | When user asks about a medicine without ordering |
| `general` | _"User said: do you have anything for headaches?"_ | Substantive messages (>5 chars, not confirmations) |

### Health Condition Detection

The engine automatically detects and stores **20+ health conditions** when mentioned in conversation:

> `diabetes` · `hypertension` · `asthma` · `allergy` · `pregnant` · `heart` · `thyroid` · `cholesterol` · `arthritis` · `migraine` · `anxiety` · `depression` · `pain` · `fever` · `cold` · `cough` · `stomach` · `infection` · `bp` · `sugar`

These are stored as `preference`-type memories and used by the Safety Agent to prevent recommending medicines that could be contraindicated.

### Memory Retrieval & Injection

```python
# Called by the Extractor Agent before every LLM call:
memory_context = memory_engine.retrieve_memory_context(user_id, session_id)

# Returns a formatted string combining:
# 1. Long-term memory facts (up to 15 most recent, cross-session)
# 2. Current session chat history (up to 12 turns, short-term)

# Example output injected into the LLM system prompt:
# === LONG-TERM USER MEMORY (facts learned from past sessions) ===
#   [2026-04-10] (preference) User mentioned they have diabetes.
#   [2026-04-10] (order) Ordered 2x Metformin 500mg on 2026-04-10.
#   [2026-04-11] (prescription) Has a prescription from Dr. Sharma.
#   [2026-04-12] (preference) User is price-sensitive and prefers affordable options.
#
# === CURRENT SESSION HISTORY (recent conversation turns) ===
#   User: Do you have anything for headaches?
#   Assistant: Yes! We have Paracetamol 500mg (₹15) and Ibuprofen 400mg (₹22).
```

This enables genuinely personalized responses like:

> _"Welcome back! I remember you use Metformin for diabetes management. Based on your last order 2 days ago, you might be running low. Would you like to reorder?"_

### Key Design Philosophy

> **Intelligent AI systems are not just about generating responses — they're about remembering and learning from users.**

By **separating the memory layer from the response generation layer**, we achieve:

1. **Efficiency** — No need for expensive large context windows
2. **Scalability** — Memory grows independently of the LLM
3. **Personalization** — Dynamic injection of only the most relevant past data
4. **Safety** — Per-user data isolation ensures no cross-patient data leaks
5. **Resilience** — Local SQLite works offline; Hindsight syncs when available

This approach transforms a basic chatbot into a **truly intelligent healthcare assistant** that gets smarter with every interaction.

---

## 📸 Screenshots

> **Note:** Add your own screenshots below by replacing the placeholder text.

### Login Page
<!-- Add screenshot: Login page with Client/Admin role toggle -->
_Screenshot: Premium dark-themed login page with glassmorphism form, Client/Admin role toggle, and Hindsight™ Memory branding._

### AI Chat Concierge
<!-- Add screenshot: Chat interface with a medicine ordering conversation -->
_Screenshot: Patient chatting with MedAssist AI to order medicines via natural language._

### Admin Command Center
<!-- Add screenshot: Admin dashboard with sales charts and inventory overview -->
_Screenshot: Admin dashboard showing real-time KPIs, sales evolution chart, stock allocation pie chart, and logistics table._

### Prescription Approval
<!-- Add screenshot: Admin reviewing an uploaded prescription -->
_Screenshot: Admin prescriptions view with pending approval requests showing uploaded prescription images._

### Order History
<!-- Add screenshot: Patient's order fulfillment history table -->
_Screenshot: Patient's fulfillment history showing ordered medicines, quantities, and settlements._

---

## 🗺 Future Roadmap

- [ ] **PostgreSQL Migration** — Move from SQLite to PostgreSQL for production scalability
- [ ] **WhatsApp Integration** — Extend the AI concierge to WhatsApp via [Twilio](https://www.twilio.com/)
- [ ] **Drug Interaction Checker** — Warn patients about potential drug interactions from their medication history
- [ ] **Voice Interface** — Speech-to-text integration (component `VoiceChat.jsx` is already scaffolded)
- [ ] **Hindsight Cloud Sync** — Full cloud-based cross-device memory persistence
- [ ] **Mobile App** — React Native companion app for patients
- [ ] **Email/SMS Notifications** — Proactive refill reminders via email or SMS
- [ ] **Multi-Pharmacy Support** — Allow multiple pharmacy branches with shared inventory

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure your code follows the existing patterns and includes appropriate documentation.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

| Resource | Usage |
|----------|-------|
| [Groq](https://groq.com/) | Ultra-fast LLM inference for the Extractor and Chitchat agents |
| [Google Gemini](https://ai.google.dev/) | Vision AI for prescription document parsing |
| [Sarvam AI](https://www.sarvam.ai/) | Indian language translation API |
| [Langfuse](https://langfuse.com/) | Open-source AI observability and tracing |
| [FastAPI](https://fastapi.tiangolo.com/) | Modern Python web framework |
| [React](https://react.dev/) | JavaScript UI library |
| [Vite](https://vitejs.dev/) | Next-generation frontend build tool |
| [TailwindCSS](https://tailwindcss.com/) | Utility-first CSS framework |
| [Framer Motion](https://www.framer.com/motion/) | Production-ready animation library |
| [Recharts](https://recharts.org/) | React charting library |
| [Lucide](https://lucide.dev/) | Beautiful open-source icons |
| [Hack With Chennai](https://hackwithchennai.live/) | The hackathon that inspired this project |

---

<p align="center">
  Built with ❤️ for <strong>Hack With Chennai 2026</strong>
</p>
