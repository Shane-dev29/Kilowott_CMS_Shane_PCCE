# Customer 360 — Privacy-First Agentic AI WooCommerce CRM

A full-stack, standalone WooCommerce CRM that enables businesses to manage customers, analyze purchasing behavior, organize customer engagement, and use an **Agentic AI Copilot** orchestrated with **LangGraph** to inspect CRM data and execute approved actions.

Featuring an **On-Premise / Local LLM architecture** (Ollama + Qwen 2.5) for complete client data privacy, mathematical **RFM segmentation**, dynamic **churn prediction**, a dedicated **Payment Recovery Hub**, and an **AI Store Insights & Churn Radar** dashboard.

Built for the Kilowott Software Engineering Challenge.

---

## 📹 Demo Videos

| Video | Description |
|-------|-------------|
| [▶️ Initial Implementation Plan](https://drive.google.com/file/d/12BMO8aizLmawo4Ty0SbXlzGxqOrMMrAa/view?usp=sharing) | Project planning, research, local LLM architecture decisions, and feature roadmap |
| [▶️ Final Project Demo](https://drive.google.com/file/d/187PBuAXzSOv0VauCKHwT32R9H_7sWMdB/view?usp=sharing) | Full walkthrough of the completed CRM with all 5 phases in action |

---

## 🚀 Key Features Across the 5-Phase Architecture

```
                      ┌────────────────────────────────────────┐
                      │          Local SQLite (crm.db)         │
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    [CRM Intelligence Engine]                       [Edge-Case Seed Engine]
    - RFM Scoring (Recency, Frequency, Monetary)    - Failed 3DS checkout dropouts
    - Churn Risk Engine (Low/Med/High/Critical)     - Stalled NEFT / on-hold bank wires
    - Customer Health Score (0-100)                 - Churning VIP accounts (>130d inactive)
    - Revenue at Risk Telemetry                     - Disputed returns & cancelled orders
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
[Customers & 360 Profile]        [Orders & Recovery]             [AI Store Insights]
- RFM Segment Filter Tabs        - "Payment Attention" Filter    - Executive Revenue Telemetry
- Health Score Progress Bars     - Overdue Age Tracking          - Revenue at Risk KPI
- Proactive Churn Danger Banner  - 1-Click "Recover Payment"     - 1-Click Operational Actions
- 1-Click AI Win-Back Outreach   - Automated Recovery Tasks      - AI Executive Strategic Brief
```

---

### 1. AI Store Insights & Churn Radar (Executive Dashboard)
- **Revenue at Risk Telemetry**: Aggregates stalled checkouts and high-risk customer relationship volume.
- **Recovery Opportunity Pipeline**: Calculates immediate recoverable capital from checkout dropouts.
- **Storewide Customer Health Score**: Average health index across all active store accounts.
- **AI Executive Strategic Brief**: Dynamically synthesized briefing outlining store-wide health, retention risks, and actionable recommendations.
- **Priority Operational Actions**: Direct 1-click execution cards:
  - *Payment Recovery*: Creates an urgent task with order metadata to rescue gateway failures.
  - *VIP Win-Back*: Launches the AI Copilot with customer context pre-loaded to generate bespoke re-engagement incentives.
- **Distribution Analytics**: Visual breakdowns of RFM customer segments and churn risk cadence.

### 2. CRM Intelligence Engine: RFM Scoring & Churn Prediction
- **Programmatic RFM Algorithm**:
  - **Recency (R)**: Days since latest completed purchase.
  - **Frequency (F)**: Cumulative completed order frequency.
  - **Monetary (M)**: Total lifetime net revenue contributed.
- **Dynamic Behavioral Segments**:
  - `Champions`: Top spenders ($\ge$ ₹25,000) with high purchase recency ($\le 60$ days).
  - `Loyal Customers`: Frequent buyers ($\ge 3$ orders) with sustained repeat cadence.
  - `Potential Loyalists`: Recent buyers ($\le 45$ days) with moderate spend.
  - `At Risk`: Substantial past spend ($\ge$ ₹10,000), but lapsed recency ($> 60$ days).
  - `Hibernating`: Low frequency buyers inactive for $> 90$ days.
  - `New Leads`: Registered contacts with 0 purchases.
- **Churn Risk Classification**: Evaluates customer inactivity against typical order cycles (`Low`, `Medium`, `High`, `Critical`).
- **Customer Health Score (0–100)**: Multi-variable score balancing order recency (+25 pts), repeat frequency (+20 pts), monetary volume (+15 pts), and penalties for failed checkouts or product return disputes (-15 pts).
- **Storewide RFM API**: `GET /api/customers/rfm-summary` endpoint for instantaneous segment distribution and risk totals.

### 3. Customer 360 Profile & Proactive Retention
- **Comprehensive Profile**: Full contact records, lifecycle tags, billing address, and registered status.
- **Individual KPIs**: Lifetime spent, valid order count, AOV benchmark, acquisition date, and days since last purchase.
- **RFM Customer Health Scorecard**: Behavioral intelligence card showing Health Score progress bar, Churn Risk badge, and Recency age.
- **Proactive Churn Danger Banner**: Automatically triggers for Critical/High risk VIPs (e.g., Tanya Kapoor: ₹64,500 spend, 135d inactive) with a 1-click **"Draft AI Win-Back Outreach"** button.
- **Unified Activity Timeline**: Chronological aggregation of purchases, agent notes, and completed touchpoints.
- **Internal Notes & Follow-Up Tasks**: Create and persist timestamped internal notes and prioritized tasks.

### 4. Failed & Pending Payment Recovery Hub in Orders
- **Payment Attention Filter**: Instant filter isolating orders requiring operational intervention (`failed`, `pending`, `on-hold`).
- **Overdue Age Tracking**: Real-time age badges (e.g., *"2d overdue"*, *"Awaiting NEFT wire verification"*, *"UPI QR pending 36h"*).
- **1-Click "Recover Payment" Action**: Automatically creates a prioritized follow-up task with customer and gateway context.
- **Line-Item Inspector Modal**: SKU, unit price, quantity, tax, shipping, and payment gateway details.
- **Guest Checkout Support**: Gracefully displays guest names and emails for orders without customer accounts.

### 5. Privacy-First Local AI Copilot (LangGraph Orchestration)
- **Zero Cloud Leakage / Local Execution**: Connects to **Ollama running Qwen 2.5 (7B)** on `http://localhost:11434/v1`. Zero client PII or financial history leaves your local environment.
- **Stateful LangGraph Workflow**: Single agent with controlled, typed backend database tools:
  - `identify_inactive_customers`
  - `identify_high_value_customers`
  - `search_customers`
  - `get_customer_details`
  - `get_customer_orders`
  - `search_orders_tool`
  - `calculate_customer_metrics`
  - `get_revenue_analytics`
  - `create_followup_task` (with duplicate task detection guard)
  - `add_customer_note`
  - `update_task_status`
- **Human-in-the-Loop Safety**: Sensitive bulk actions trigger an interactive **Action Approval Card** requiring operator confirmation before committing records to SQLite.
- **Multi-Provider Fallback**: Seamlessly supports `ollama`, `groq`, `openai`, `openrouter`, or offline structured agent mode.

### 6. WooCommerce Synchronization Center
- **Honest Mode Tracking**: Clearly distinguishes seeded **Demo Mode** from **Live WooCommerce Store**.
- **REST API v3 Integration**: Communicates with WooCommerce endpoints (`/wp-json/wc/v3/`) via `httpx`.
- **Diagnostic Connection Test**: Performs live handshake tests and reports exact store versions.
- **Duplicate-Safe Sync**: Upserts customers and orders by external WooCommerce IDs without overwriting CRM notes or tasks.
- **1-Click Demo Reset**: `POST /api/sync/reset-demo` endpoint to reset and replenish the rich edge-case seed dataset anytime.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Recharts, Lucide React, Axios |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, SQLite (`crm.db`), Pydantic v2, httpx |
| **Agentic AI** | LangGraph, LangChain Core, LangChain OpenAI, Ollama (Local `qwen2.5:7b`) |
| **Integration** | WooCommerce REST API v3 |
| **Testing** | Standalone automated 5-phase test suite (`backend/test_features.py`) |

---

## 💻 Quick Start & Launch (Windows)

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (v24 tested)
- npm 9 or higher
- *(Optional)* [Ollama](https://ollama.com/) with `ollama run qwen2.5:7b` for local private LLM reasoning.

---

### Step 1: Backend Setup & Launch

1. Open PowerShell in `backend`:
```powershell
cd c:\Users\remed\Desktop\Kilowott\backend
```

2. Activate the Python virtual environment:
```powershell
.\venv\Scripts\activate
```

3. Configure environment variables in `backend/.env`:
```ini
DATABASE_URL=sqlite:///./crm.db

# Local Ollama Configuration (Default Privacy Mode)
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:7b
LLM_API_KEY=ollama
LLM_BASE_URL=http://localhost:11434/v1

# Optional Live WooCommerce REST API Credentials
WOOCOMMERCE_STORE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
```

4. Start the FastAPI backend server:
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Backend API running at: `http://127.0.0.1:8000`  
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

---

### Step 2: Frontend Setup & Launch

1. Open a new PowerShell window in `frontend`:
```powershell
cd c:\Users\remed\Desktop\Kilowott\frontend
```

2. Start the Vite development server:
```powershell
npm run dev
```
- Frontend application running at: `http://localhost:5173/`

---

## 🧪 Automated Feature Verification Test Suite

A standalone test suite validates all 5 phases directly in-memory against FastAPI:

```powershell
cd c:\Users\remed\Desktop\Kilowott\backend
.\venv\Scripts\python.exe test_features.py
```

### Verified Capabilities:
- ✅ **Phase 1**: Edge-case seed data replenishment (`POST /api/sync/reset-demo`), failed checkouts, stalled wires, disputed returns.
- ✅ **Phase 2**: RFM algorithm (Lead, Champions, At-Risk), Churn Risk (Critical), Health Score (0-100), and `GET /api/customers/rfm-summary`.
- ✅ **Phase 3**: Customer 360 RFM scorecard, timeline aggregation, and internal note persistence.
- ✅ **Phase 4**: Payment Attention filter isolation and 1-click recovery task creation.
- ✅ **Phase 5**: AI Store Insights (`GET /api/ai/insights`), revenue at risk telemetry, executive brief, and priority actions.
- ✅ **AI Copilot**: LangGraph tool reasoning, human-in-the-loop action approval card intercept, and safety rejection flow.

---

## 📁 Repository Structure

```
Kilowott/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── graph.py          # LangGraph workflow, state, conditional tool routing & approvals
│   │   │   ├── llm_factory.py    # Configurable LLM provider factory (Ollama, Groq, OpenAI)
│   │   │   └── tools.py          # 10 database tools with duplicate guards & safety checks
│   │   ├── routers/
│   │   │   ├── ai.py             # /api/ai/chat, /api/ai/approve, /api/ai/insights
│   │   │   ├── customers.py      # /api/customers, Customer 360, /rfm-summary, CSV export
│   │   │   ├── dashboard.py      # /api/dashboard/summary, revenue trends
│   │   │   ├── orders.py         # /api/orders, line items, search & status filters
│   │   │   ├── sync.py           # /api/sync/run, /api/sync/reset-demo, /api/sync/history
│   │   │   └── tasks.py          # /api/tasks, task creation & status lifecycle
│   │   ├── services/
│   │   │   ├── crm_service.py    # RFM scoring, churn risk engine, health scores, insights synthesis
│   │   │   └── woocommerce.py    # WooCommerce REST API v3 client & duplicate-safe sync
│   │   ├── config.py             # App settings using Pydantic
│   │   ├── database.py           # SQLAlchemy engine & session factory
│   │   ├── models.py             # Database models (Customer, Order, Note, Task, SyncLog)
│   │   ├── schemas.py            # Pydantic schemas (RFM, Customer, Order, Insights, Chat)
│   │   ├── seed_data.py          # Rich edge-case dataset (16 customers, 27+ orders)
│   │   └── main.py               # FastAPI entrypoint, CORS & lifespan seeding
│   ├── test_features.py          # Automated 5-phase test suite
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios API client with extended AI timeouts
│   │   ├── components/
│   │   │   ├── CopilotDrawer.jsx # Slide-over AI Copilot with tool status & approval cards
│   │   │   ├── Header.jsx        # Navigation header & quick triggers
│   │   │   ├── MetricCard.jsx    # KPI Metric display cards
│   │   │   ├── Sidebar.jsx       # Persistent CRM navigation including Store Insights
│   │   │   └── StatusBadge.jsx   # RFM badges, churn risk pills, health score progress bars
│   │   ├── pages/
│   │   │   ├── CopilotPage.jsx   # Dedicated AI Copilot Studio
│   │   │   ├── CustomerDetail.jsx# Customer 360 profile with RFM scorecard & win-back banner
│   │   │   ├── Customers.jsx     # Customers table with RFM filter chips & health score columns
│   │   │   ├── Dashboard.jsx     # Overview dashboard with Recharts analytics
│   │   │   ├── Insights.jsx      # AI Store Insights & Churn Radar executive dashboard
│   │   │   ├── Orders.jsx        # Orders directory with Payment Attention Hub & recovery
│   │   │   ├── SyncCenter.jsx    # WooCommerce synchronization center
│   │   │   └── Tasks.jsx         # Follow-up task management queue
│   │   ├── App.jsx               # React Router root & layout
│   │   ├── index.css             # Tailwind CSS styles & modern typography
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
└── README.md
```

---

## 🛡️ Tool Safety & Execution Guarantees

1. **Local Model Privacy**: All customer PII and purchase amounts remain on-premise when using Ollama (`qwen2.5:7b`).
2. **No Arbitrary SQL**: The AI Copilot is strictly restricted to defined Python tools with explicit typed arguments.
3. **Entity Validation**: Every target customer is checked in the database before task creation.
4. **Duplicate Prevention**: Re-running follow-up task creation checks for existing pending tasks with identical titles to prevent duplicate spam.
5. **Human-in-the-Loop Confirmation**: Sensitive bulk task actions must be confirmed by the operator via interactive approval cards before changes commit to the database.
6. **Data Preservation**: Synchronizing with external WooCommerce stores preserves CRM notes, RFM tags, and tasks.
