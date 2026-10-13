# Customer 360 — Agentic AI-Powered WooCommerce CRM

A full-stack, standalone WooCommerce CRM that enables businesses to manage customers, analyze purchasing behavior, organize customer engagement, and use an **AI Copilot** orchestrated with **LangGraph** to inspect CRM data and execute approved actions.

Built for the Kilowott Software Engineering Challenge.

---

## 🚀 Key Features

### 1. Overview Dashboard
- **Real-time KPI Metrics**: Total Customers, Total Orders, Valid Revenue, Average Order Value (AOV), Returning Customer Rate (%), and Pending Follow-up Tasks.
- **Accurate Revenue Calculation**: Excludes failed, cancelled, and refunded orders.
- **Interactive Visualizations**:
  - Revenue trends over the past 6 months using Recharts Area Chart with Indian Rupee (₹) formatting.
  - Order status distribution using Recharts Donut Chart.
- **Recent Orders & Unified Activity Feed**: Live stream of recent customer orders, internal CRM notes, and follow-up tasks.

### 2. Customer Management & Segmentation
- **Customer Directory**: Name, email, phone, city, total spent, order count, and last purchase date.
- **Dynamic Rule-Based Segmentation**:
  - **High-Value**: Total spend $\ge$ ₹15,000.
  - **Inactive**: Purchased previously, but no orders in the last 60 days.
  - **Returning**: Placed $\ge 2$ valid orders.
  - **New**: 1 purchase within the last 30 days.
  - **Lead**: Signed up with 0 purchases.
- **Search & Multi-field Sorting**: Search by name, email, phone, or location. Sort by total spent, order frequency, name, or last purchase date.
- **One-Click CSV Export**: Instant export of filtered and sorted customer results.

### 3. Customer 360 Profile
- **Comprehensive Profile**: Contact info, lifecycle segment, customer tags, and address.
- **Individual KPIs**: Lifetime spent, order count, AOV, first order date, and days since last purchase.
- **Unified Activity Timeline**: Chronological aggregation of purchases, agent notes, and completed tasks.
- **Internal Notes**: Create and persist timestamped internal notes with author attribution.
- **Follow-up Tasks**: Assign prioritized tasks with due dates directly to the customer.
- **Context-Aware AI Copilot**: "Ask Copilot about this customer" opens the Copilot drawer with the customer preset in context.

### 4. Order Management
- Search by order number, customer name, or email.
- Filter by fulfillment state (`completed`, `processing`, `pending`, `on-hold`, `cancelled`, `failed`).
- Detailed line-item modal with SKU, unit price, quantity, tax, shipping, and payment gateway.
- Gracefully handles guest checkouts without registered customer records.

### 5. Follow-up Task Management
- Prioritized task queue (`High`, `Medium`, `Low`) with target due dates.
- Filter by `Pending` or `Completed` status.
- Interactive status toggling with instant database persistence (`completed_at` timestamps).
- Clickable links jumping directly to the corresponding Customer 360 profile.

### 6. WooCommerce Synchronization Center
- **Honest Mode Tracking**: Clearly distinguishes seeded **Demo Mode** from **Live WooCommerce Store**.
- **REST API v3 Integration**: Uses `httpx` to communicate with WooCommerce REST endpoints (`/wp-json/wc/v3/`).
- **Connection Test**: Diagnostic tool that performs live handshake tests and reports exact store versions.
- **Duplicate-Safe Sync**: Upserts customers and orders by external WooCommerce IDs without overwriting CRM-specific notes or tasks.
- **Audit History**: Complete log of sync attempts, timestamps, records synced, and failure reasons.

### 7. Agentic AI Copilot (LangGraph Orchestration)
- **Stateful LangGraph Workflow**: Single agent with controlled backend tools:
  - `identify_inactive_customers`
  - `identify_high_value_customers`
  - `search_customers`
  - `get_customer_details`
  - `get_customer_orders`
  - `calculate_customer_metrics`
  - `get_revenue_analytics`
  - `create_followup_task`
  - `add_customer_note`
  - `update_task_status`
- **Human-in-the-Loop Safety**: Sensitive bulk actions (such as generating follow-up tasks for multiple inactive accounts) trigger an **Action Approval Card** requiring user confirmation before committing changes to SQLite.
- **Genuine Tool Execution Status**: Displays live agent tool steps (`calling`, `completed`, `requires_approval`, `failed`).
- **Dual Operating Modes**:
  - **Live LLM Mode**: Uses configured API model (`OpenAI`, `Groq`, `OpenRouter`, `Ollama`) via LangChain / LangGraph.
  - **Offline Structured Agent Mode**: When no external API key is provided, executes real CRM database queries and approval flows transparently without pretending mock text is LLM-generated.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Recharts, Lucide React, Axios |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy, SQLite, Pydantic v2, httpx |
| **Agentic AI** | LangGraph, LangChain Core, LangChain OpenAI |
| **Integration** | WooCommerce REST API v3 |

---

## 💻 Quick Start & Setup (Windows)

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher (v24 tested)
- npm 9 or higher

---

### Step 1: Clone & Inspect Workspace
```powershell
cd c:\Users\remed\Desktop\Kilowott
```

---

### Step 2: Backend Setup & Launch

1. Open PowerShell in `backend`:
```powershell
cd c:\Users\remed\Desktop\Kilowott\backend
```

2. Create and activate a Python virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\activate
```

3. Install backend dependencies:
```powershell
pip install -r requirements.txt
```

4. Configure environment variables:
```powershell
copy .env.example .env
```
*(Optional: Open `backend/.env` to configure `LLM_API_KEY` or `WOOCOMMERCE_*` credentials. If left empty, the CRM runs in Demo Mode with full tool functionality).*

5. Start the FastAPI backend server:
```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be running at: `http://127.0.0.1:8000`  
Interactive Swagger Docs at: `http://127.0.0.1:8000/docs`

---

### Step 3: Frontend Setup & Launch

1. Open a new PowerShell window in `frontend`:
```powershell
cd c:\Users\remed\Desktop\Kilowott\frontend
```

2. Install dependencies:
```powershell
npm install
```

3. Start the Vite development server:
```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend application will be accessible at: `http://127.0.0.1:5173/`

---

## 🧪 Testing the AI Copilot & Agentic Workflow

1. Open `http://127.0.0.1:5173/` in your browser.
2. Click the floating **"Ask AI Copilot"** button in the bottom-right corner.
3. Test the challenge benchmark prompt:
   > *"Find customers who haven't purchased in 60 days but have spent more than ₹5,000. Create follow-up tasks for them."*
4. **Observe the Agentic Steps**:
   - The agent calls `identify_inactive_customers` with `min_days=60` and `min_spent=5000`.
   - Returns matching customers (Priya Patel, Rohan Mehta, Vikram Desai) with exact order evidence.
   - Intercepts the bulk task creation and renders the **Action Approval Card**.
5. Click **"Approve & Execute"** on the card.
6. The agent creates the 3 tasks in SQLite and reports success.
7. Open **"Follow-up Tasks"** in the sidebar to verify the tasks are live in the database!

---

## ⚙️ Environment Variables Reference (`backend/.env`)

```ini
# Application
DATABASE_URL=sqlite:///./crm.db

# WooCommerce REST API v3 Integration (Optional)
WOOCOMMERCE_STORE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WOOCOMMERCE_TIMEOUT=15.0

# LLM & Agentic AI Configuration
# Options: openai, groq, openrouter, ollama
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=
```

---

## 📁 Repository Structure

```
Kilowott/
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── graph.py          # LangGraph workflow, state, conditional tool routing & approvals
│   │   │   ├── llm_factory.py    # Configurable LLM provider factory (OpenAI, Groq, Ollama)
│   │   │   └── tools.py          # Validated database tools with safety checks
│   │   ├── routers/
│   │   │   ├── ai.py             # /api/ai/chat, /api/ai/approve, /api/ai/config-status
│   │   │   ├── customers.py      # /api/customers, Customer 360, CSV export
│   │   │   ├── dashboard.py      # /api/dashboard/summary, revenue trends
│   │   │   ├── orders.py         # /api/orders, line items, search
│   │   │   ├── sync.py           # /api/sync/test-connection, /api/sync/run, /api/sync/history
│   │   │   └── tasks.py          # /api/tasks, task creation & status toggle
│   │   ├── services/
│   │   │   ├── crm_service.py    # Analytics, segmentation engine, timeline builder
│   │   │   └── woocommerce.py    # WooCommerce REST API v3 client & duplicate-safe sync
│   │   ├── config.py             # Settings using Pydantic
│   │   ├── database.py           # SQLAlchemy engine & session factory
│   │   ├── models.py             # Database models (Customer, Order, Note, Task, SyncLog)
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── seed_data.py          # Realistic seeded WooCommerce dataset
│   │   └── main.py               # FastAPI entrypoint, CORS & lifespan seeding
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js         # Axios API client
│   │   ├── components/
│   │   │   ├── CopilotDrawer.jsx # Slide-over AI Copilot with tool status & approval cards
│   │   │   ├── Header.jsx        # Navigation header & quick triggers
│   │   │   ├── MetricCard.jsx    # KPI Metric display cards
│   │   │   ├── Sidebar.jsx       # Persistent CRM navigation
│   │   │   └── StatusBadge.jsx   # Segment, order status, and priority badges
│   │   ├── pages/
│   │   │   ├── CopilotPage.jsx   # Dedicated AI Copilot Studio
│   │   │   ├── CustomerDetail.jsx# Customer 360 profile with unified timeline
│   │   │   ├── Customers.jsx     # Customers table, filters & CSV export
│   │   │   ├── Dashboard.jsx     # Overview dashboard with Recharts analytics
│   │   │   ├── Orders.jsx        # Orders directory & line items modal
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

1. **No Arbitrary SQL**: The AI Copilot is strictly restricted to defined Python tools with explicit typed arguments.
2. **Entity Validation**: Every target customer is checked in the database before task creation.
3. **Duplicate Prevention**: Re-running follow-up task creation checks for existing pending tasks with identical titles to prevent duplicate spam.
4. **Human-in-the-Loop Confirmation**: Sensitive bulk task actions must be approved by the user via interactive approval cards.
5. **Data Preservation**: Synchronizing with external WooCommerce stores preserves CRM notes and tasks.
