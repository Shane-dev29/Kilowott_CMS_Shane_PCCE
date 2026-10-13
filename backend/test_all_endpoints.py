import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api"

passed_tests = 0
failed_tests = 0

def log_test(name, success, details=""):
    global passed_tests, failed_tests
    if success:
        passed_tests += 1
        print(f"✅ PASS: {name} {details}")
    else:
        failed_tests += 1
        print(f"❌ FAIL: {name} - {details}")

def request(path, method="GET", body=None):
    url = f"{BASE_URL}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8")
        try:
            return resp.status, json.loads(content)
        except:
            return resp.status, content

print("=" * 60)
print("🚀 RUNNING COMPREHENSIVE BACKEND FUNCTIONALITY TESTS")
print("=" * 60)

# 1. Health
try:
    status, data = request("/health")
    log_test("GET /api/health", status == 200 and data.get("status") == "ok", f"-> {data.get('app')}")
except Exception as e:
    log_test("GET /api/health", False, str(e))

# 2. Dashboard Summary
try:
    status, data = request("/dashboard/summary")
    valid = status == 200 and data.get("total_customers", 0) > 0 and data.get("total_revenue", 0) > 0
    details = f"Customers: {data.get('total_customers')}, Orders: {data.get('total_orders')}, Revenue: ₹{data.get('total_revenue'):,.2f}, AOV: ₹{data.get('average_order_value'):,.2f}"
    log_test("GET /api/dashboard/summary", valid, details)
except Exception as e:
    log_test("GET /api/dashboard/summary", False, str(e))

# 3. Dashboard Revenue Trends
try:
    status, data = request("/dashboard/revenue")
    valid = status == 200 and len(data.get("revenue_trends", [])) > 0
    log_test("GET /api/dashboard/revenue", valid, f"Trends months: {len(data.get('revenue_trends', []))}")
except Exception as e:
    log_test("GET /api/dashboard/revenue", False, str(e))

# 4. Customers List
try:
    status, data = request("/customers")
    valid = status == 200 and isinstance(data, list) and len(data) > 0
    log_test("GET /api/customers", valid, f"Count: {len(data)}")
except Exception as e:
    log_test("GET /api/customers", False, str(e))

# 5. Customers Search & Filter (Inactive)
try:
    status, data = request("/customers?segment=Inactive")
    valid = status == 200 and len(data) > 0 and all(c["segment"] == "Inactive" for c in data)
    names = [c["full_name"] for c in data]
    log_test("GET /api/customers?segment=Inactive", valid, f"Found inactive: {', '.join(names)}")
except Exception as e:
    log_test("GET /api/customers?segment=Inactive", False, str(e))

# 6. Customers Sorting
try:
    status, data = request("/customers?sort_by=total_spent&sort_order=desc")
    top_spender = data[0] if data else {}
    valid = status == 200 and top_spender.get("total_spent", 0) > 0
    log_test("GET /api/customers (sort_by=total_spent)", valid, f"Top spender: {top_spender.get('full_name')} (₹{top_spender.get('total_spent'):,.2f})")
except Exception as e:
    log_test("GET /api/customers (sort_by=total_spent)", False, str(e))

# 7. Customers CSV Export
try:
    status, data = request("/customers?export=csv")
    valid = status == 200 and "Customer ID,Woo ID,Name,Email" in data
    log_test("GET /api/customers?export=csv", valid, f"CSV header verified ({len(data.splitlines())} lines)")
except Exception as e:
    log_test("GET /api/customers?export=csv", False, str(e))

# 8. Customer 360 Detail
try:
    status, data = request("/customers/1")
    valid = status == 200 and data.get("id") == 1 and len(data.get("timeline", [])) > 0
    log_test("GET /api/customers/1 (Customer 360)", valid, f"Customer: {data.get('full_name')}, Timeline events: {len(data.get('timeline'))}, Orders: {len(data.get('orders'))}")
except Exception as e:
    log_test("GET /api/customers/1 (Customer 360)", False, str(e))

# 9. Customer Orders
try:
    status, data = request("/customers/1/orders")
    valid = status == 200 and len(data) > 0
    log_test("GET /api/customers/1/orders", valid, f"Orders retrieved: {len(data)}")
except Exception as e:
    log_test("GET /api/customers/1/orders", False, str(e))

# 10. Customer Notes & Create Note
try:
    new_note = {"content": "Automated backend integration verification test note.", "created_by": "Test Suite"}
    status, created_note = request("/customers/1/notes", method="POST", body=new_note)
    valid_create = status == 200 and created_note.get("id") > 0
    status_list, notes_list = request("/customers/1/notes")
    valid_list = status_list == 200 and any(n["id"] == created_note["id"] for n in notes_list)
    log_test("POST & GET /api/customers/1/notes", valid_create and valid_list, f"Created Note #{created_note.get('id')}")
except Exception as e:
    log_test("POST & GET /api/customers/1/notes", False, str(e))

# 11. Orders List
try:
    status, data = request("/orders")
    valid = status == 200 and len(data) > 0
    log_test("GET /api/orders", valid, f"Total orders: {len(data)}")
except Exception as e:
    log_test("GET /api/orders", False, str(e))

# 12. Orders Status Filter (Completed)
try:
    status, data = request("/orders?status=completed")
    valid = status == 200 and all(o["status"] == "completed" for o in data)
    log_test("GET /api/orders?status=completed", valid, f"Completed orders: {len(data)}")
except Exception as e:
    log_test("GET /api/orders?status=completed", False, str(e))

# 13. Order Detail & Guest handling
try:
    status, data = request("/orders/1")
    valid = status == 200 and data.get("order_number") and len(data.get("items", [])) > 0
    log_test("GET /api/orders/1", valid, f"Order: {data.get('order_number')}, Total: ₹{data.get('total'):,.2f}, Items: {len(data.get('items'))}")
except Exception as e:
    log_test("GET /api/orders/1", False, str(e))

# 14. Tasks Management: Create, List, Patch
try:
    task_payload = {
        "customer_id": 1,
        "title": "Verify task creation via backend test",
        "description": "Integration test task",
        "priority": "high",
        "created_by": "Backend Test"
    }
    status, created_task = request("/tasks", method="POST", body=task_payload)
    tid = created_task.get("id")
    valid_create = status == 200 and tid > 0

    # Patch task to completed
    status_patch, patched = request(f"/tasks/{tid}", method="PATCH", body={"status": "completed"})
    valid_patch = status_patch == 200 and patched.get("status") == "completed" and patched.get("completed_at") is not None

    log_test("POST & PATCH /api/tasks", valid_create and valid_patch, f"Task #{tid} created and marked completed")
except Exception as e:
    log_test("POST & PATCH /api/tasks", False, str(e))

# 15. Sync: Test Connection
try:
    status, data = request("/sync/test-connection", method="POST")
    valid = status == 200 and "message" in data
    log_test("POST /api/sync/test-connection", valid, f"Response: {data.get('message')[:70]}...")
except Exception as e:
    log_test("POST /api/sync/test-connection", False, str(e))

# 16. Sync: Run Demo Refresh
try:
    status, data = request("/sync/run?mode=demo", method="POST")
    valid = status == 200 and data.get("success") == True
    log_test("POST /api/sync/run?mode=demo", valid, f"Synced {data.get('customers_synced')} customers, {data.get('orders_synced')} orders")
except Exception as e:
    log_test("POST /api/sync/run?mode=demo", False, str(e))

# 17. Sync: History
try:
    status, data = request("/sync/history")
    valid = status == 200 and len(data) > 0
    log_test("GET /api/sync/history", valid, f"History records: {len(data)}")
except Exception as e:
    log_test("GET /api/sync/history", False, str(e))

# 18. AI Copilot: Config Status
try:
    status, data = request("/ai/config-status")
    valid = status == 200 and data.get("llm_configured") == True
    log_test("GET /api/ai/config-status", valid, f"Active: {data.get('provider')} ({data.get('model')})")
except Exception as e:
    log_test("GET /api/ai/config-status", False, str(e))

# 19. AI Copilot: Live Groq LLM reasoning & tool call
try:
    chat_body = {"message": "Who is my highest-spending customer? Tell me their name and total spent."}
    status, data = request("/ai/chat", method="POST", body=chat_body)
    events = [e["tool_name"] for e in data.get("events", [])]
    valid = status == 200 and ("identify_high_value_customers" in events or "search_customers" in events) and "Aarav" in data.get("reply", "")
    log_test("POST /api/ai/chat (Groq LLM Tool Calling)", valid, f"Tools invoked: {events}, Reply contains target customer: {'Aarav' in data.get('reply')}")
except Exception as e:
    log_test("POST /api/ai/chat (Groq LLM Tool Calling)", False, str(e))

# 20. AI Copilot: Human-in-the-Loop Bulk Action Flow (Approval Required)
try:
    req_body = {"message": "Find customers who haven't purchased in 60 days but have spent more than ₹5,000. Create follow-up tasks for them."}
    status, data = request("/ai/chat", method="POST", body=req_body)
    requires_approval = data.get("requires_approval") == True
    pending = data.get("pending_action")
    valid = status == 200 and requires_approval and pending is not None
    log_test("POST /api/ai/chat (Human-in-the-Loop Intercept)", valid, f"requires_approval={requires_approval}, action_type={pending.get('action_type') if pending else None}")

    # 21. AI Copilot: Execute Approved Action
    if pending:
        approve_body = {
            "action_token": pending["action_token"],
            "approved": True,
            "payload": pending["payload"]
        }
        status_app, app_data = request("/ai/approve", method="POST", body=approve_body)
        valid_app = status_app == 200 and app_data.get("success") == True and app_data.get("created_count", 0) > 0
        log_test("POST /api/ai/approve (Commit Approved Tasks)", valid_app, f"Tasks committed: {app_data.get('created_count')}")

    # 22. AI Copilot: Rejection Safety Flow
    reject_body = {
        "action_token": "dummy-token",
        "approved": False,
        "payload": {}
    }
    status_rej, rej_data = request("/ai/approve", method="POST", body=reject_body)
    valid_rej = status_rej == 200 and rej_data.get("success") == False and "cancelled" in rej_data.get("message", "").lower()
    log_test("POST /api/ai/approve (Rejection Flow)", valid_rej, f"Rejection message: {rej_data.get('message')}")
except Exception as e:
    log_test("POST /api/ai/chat (Human-in-the-Loop & Approval)", False, str(e))

print("=" * 60)
print(f"🏁 TEST SUMMARY: {passed_tests} PASSED | {failed_tests} FAILED out of {passed_tests + failed_tests} TESTS")
print("=" * 60)
