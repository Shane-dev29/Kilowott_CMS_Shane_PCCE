from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Order Item schemas
class OrderItemSchema(BaseModel):
    id: int
    product_name: str
    quantity: int
    unit_price: float
    total_price: float
    sku: Optional[str] = None

    class Config:
        from_attributes = True

# Order schemas
class OrderSchema(BaseModel):
    id: int
    woo_id: Optional[int] = None
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    guest_email: Optional[str] = None
    guest_name: Optional[str] = None
    order_number: str
    status: str
    total: float
    subtotal: float
    tax_total: float
    shipping_total: float
    currency: str
    date_created: datetime
    date_completed: Optional[datetime] = None
    payment_method: str
    is_demo: bool
    items_count: Optional[int] = 0
    items: Optional[List[OrderItemSchema]] = []

    class Config:
        from_attributes = True

# Customer Note schemas
class CustomerNoteCreate(BaseModel):
    content: str
    created_by: Optional[str] = "CRM Agent"

class CustomerNoteSchema(BaseModel):
    id: int
    customer_id: int
    content: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

# Follow-up Task schemas
class FollowUpTaskCreate(BaseModel):
    customer_id: int
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"  # low, medium, high
    due_date: Optional[datetime] = None
    created_by: Optional[str] = "CRM Agent"

class FollowUpTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None

class FollowUpTaskSchema(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    title: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[datetime] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    created_by: str

    class Config:
        from_attributes = True

# Customer schemas
class CustomerSummarySchema(BaseModel):
    id: int
    woo_id: Optional[int] = None
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "IN"
    orders_count: int
    total_spent: float
    last_order_date: Optional[datetime] = None
    segment: str
    custom_tags: Optional[str] = ""
    is_demo: bool

    class Config:
        from_attributes = True

class TimelineEvent(BaseModel):
    id: str
    type: str  # "order", "note", "task"
    title: str
    description: Optional[str] = None
    timestamp: datetime
    meta: Optional[Dict[str, Any]] = None

class CustomerDetailSchema(BaseModel):
    id: int
    woo_id: Optional[int] = None
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "IN"
    postcode: Optional[str] = None
    created_at: datetime
    is_demo: bool
    custom_tags: Optional[str] = ""
    
    # Metrics
    orders_count: int
    total_spent: float
    average_order_value: float
    first_order_date: Optional[datetime] = None
    last_order_date: Optional[datetime] = None
    segment: str
    
    # Relations
    orders: List[OrderSchema] = []
    notes: List[CustomerNoteSchema] = []
    tasks: List[FollowUpTaskSchema] = []
    timeline: List[TimelineEvent] = []

    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardSummarySchema(BaseModel):
    total_customers: int
    total_orders: int
    total_revenue: float
    average_order_value: float
    returning_customer_rate: float
    pending_tasks_count: int
    is_demo_mode: bool
    last_sync: Optional[datetime] = None
    recent_orders: List[OrderSchema]
    status_distribution: Dict[str, int]
    revenue_trends: List[Dict[str, Any]]
    recent_activity: List[TimelineEvent]

# Sync schemas
class SyncTestResponse(BaseModel):
    success: bool
    message: str
    store_url: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class SyncRunResponse(BaseModel):
    success: bool
    message: str
    customers_synced: int
    orders_synced: int
    is_demo: bool
    log_id: int

class SyncLogSchema(BaseModel):
    id: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    is_demo_sync: bool
    customers_synced: int
    orders_synced: int
    error_message: Optional[str] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True

# AI Copilot schemas
class ChatMessage(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = "default"
    customer_context_id: Optional[int] = None  # selected customer context
    chat_history: Optional[List[ChatMessage]] = []

class ToolExecutionEvent(BaseModel):
    tool_name: str
    status: str  # "calling", "completed", "failed", "requires_approval"
    input_args: Optional[Dict[str, Any]] = None
    output_result: Optional[Any] = None
    message: Optional[str] = None

class PendingAction(BaseModel):
    action_type: str  # e.g., "bulk_create_tasks", "create_task"
    description: str
    payload: Dict[str, Any]
    action_token: str

class ChatResponse(BaseModel):
    reply: str
    events: List[ToolExecutionEvent] = []
    requires_approval: bool = False
    pending_action: Optional[PendingAction] = None
    llm_configured: bool = True
    provider: str = ""
    model: str = ""

class ActionApprovalRequest(BaseModel):
    action_token: str
    approved: bool
    payload: Dict[str, Any]
