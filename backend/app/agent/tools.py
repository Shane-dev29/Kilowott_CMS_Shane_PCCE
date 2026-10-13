from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Customer, Order, OrderItem, CustomerNote, FollowUpTask
from app.services.crm_service import (
    calculate_segment, get_customer_summary, INVALID_ORDER_STATUSES
)

def search_customers_tool(db: Session, query: str = "", segment: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Search customers by name, email, phone or filter by segment.
    """
    customers = db.query(Customer).all()
    results = []
    q = query.lower() if query else ""
    seg = segment.lower() if segment and segment.lower() != "all" else None

    for c in customers:
        summary = get_customer_summary(c)
        if seg and summary.segment.lower() != seg:
            continue
        if q:
            match_name = q in summary.full_name.lower()
            match_email = q in summary.email.lower()
            match_phone = bool(summary.phone and q in summary.phone.lower())
            if not (match_name or match_email or match_phone):
                continue

        results.append({
            "id": c.id,
            "woo_id": c.woo_id,
            "name": summary.full_name,
            "email": c.email,
            "phone": c.phone,
            "city": c.city,
            "segment": summary.segment,
            "orders_count": summary.orders_count,
            "total_spent": summary.total_spent,
            "last_order_date": summary.last_order_date.strftime("%Y-%m-%d") if summary.last_order_date else None,
            "tags": c.custom_tags or ""
        })
    return results


def get_customer_details_tool(db: Session, customer_id: int) -> Dict[str, Any]:
    """
    Retrieve comprehensive customer profile including order history, notes, and pending tasks.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return {"error": f"Customer with ID {customer_id} does not exist."}

    summary = get_customer_summary(customer)
    
    orders = []
    for o in sorted(customer.orders, key=lambda x: x.date_created, reverse=True):
        orders.append({
            "order_id": o.id,
            "order_number": o.order_number,
            "date": o.date_created.strftime("%Y-%m-%d"),
            "status": o.status,
            "total": o.total,
            "items": [it.product_name for it in o.items]
        })

    notes = [
        {"id": n.id, "content": n.content, "created_by": n.created_by, "date": n.created_at.strftime("%Y-%m-%d")}
        for n in sorted(customer.notes, key=lambda x: x.created_at, reverse=True)
    ]

    tasks = [
        {"id": t.id, "title": t.title, "priority": t.priority, "status": t.status, "due_date": t.due_date.strftime("%Y-%m-%d") if t.due_date else None}
        for t in sorted(customer.tasks, key=lambda x: x.created_at, reverse=True)
    ]

    return {
        "id": customer.id,
        "name": summary.full_name,
        "email": customer.email,
        "phone": customer.phone,
        "location": f"{customer.city or ''}, {customer.state or ''}, {customer.country or 'IN'}",
        "segment": summary.segment,
        "orders_count": summary.orders_count,
        "total_spent": summary.total_spent,
        "last_order_date": summary.last_order_date.strftime("%Y-%m-%d") if summary.last_order_date else None,
        "recent_orders": orders[:5],
        "notes": notes,
        "tasks": tasks
    }


def get_customer_orders_tool(db: Session, customer_id: int) -> List[Dict[str, Any]]:
    """
    Get all orders and line items for a specific customer.
    """
    orders = db.query(Order).filter(Order.customer_id == customer_id).order_by(Order.date_created.desc()).all()
    results = []
    for o in orders:
        items = [{"product": it.product_name, "quantity": it.quantity, "price": it.unit_price} for it in o.items]
        results.append({
            "order_id": o.id,
            "order_number": o.order_number,
            "date": o.date_created.strftime("%Y-%m-%d"),
            "status": o.status,
            "total": o.total,
            "payment_method": o.payment_method,
            "items": items
        })
    return results


def search_orders_tool(db: Session, status: Optional[str] = None, customer_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Search and filter orders by status or customer ID.
    """
    query = db.query(Order)
    if status and status.lower() != "all":
        query = query.filter(Order.status == status.lower())
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
        
    orders = query.order_by(Order.date_created.desc()).limit(20).all()
    results = []
    for o in orders:
        c_name = o.customer.full_name if o.customer else (o.guest_name or "Guest")
        results.append({
            "order_id": o.id,
            "order_number": o.order_number,
            "customer_name": c_name,
            "customer_email": o.customer.email if o.customer else (o.guest_email or ""),
            "date": o.date_created.strftime("%Y-%m-%d"),
            "status": o.status,
            "total": o.total,
            "item_count": len(o.items)
        })
    return results


def calculate_customer_metrics_tool(db: Session, customer_id: int) -> Dict[str, Any]:
    """
    Calculate AOV, total spending, order frequency, and recency for a customer.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return {"error": f"Customer ID {customer_id} not found."}

    valid_orders = [o for o in customer.orders if o.status not in INVALID_ORDER_STATUSES]
    orders_count = len(valid_orders)
    total_spent = sum(o.total for o in valid_orders)
    aov = (total_spent / orders_count) if orders_count > 0 else 0.0

    sorted_orders = sorted(valid_orders, key=lambda x: x.date_created, reverse=True)
    last_date = sorted_orders[0].date_created if sorted_orders else None
    first_date = sorted_orders[-1].date_created if sorted_orders else None
    
    days_since_last = (datetime.utcnow() - last_date).days if last_date else None

    return {
        "customer_id": customer.id,
        "name": customer.full_name,
        "valid_orders_count": orders_count,
        "total_spent_inr": round(total_spent, 2),
        "average_order_value_inr": round(aov, 2),
        "first_purchase_date": first_date.strftime("%Y-%m-%d") if first_date else None,
        "last_purchase_date": last_date.strftime("%Y-%m-%d") if last_date else None,
        "days_since_last_order": days_since_last,
        "segment": calculate_segment(orders_count, total_spent, last_date)
    }


def get_revenue_analytics_tool(db: Session) -> Dict[str, Any]:
    """
    Retrieve overall revenue metrics, valid orders count, AOV, and monthly distribution.
    """
    orders = db.query(Order).all()
    valid_orders = [o for o in orders if o.status not in INVALID_ORDER_STATUSES]
    total_revenue = sum(o.total for o in valid_orders)
    aov = (total_revenue / len(valid_orders)) if valid_orders else 0.0

    return {
        "total_revenue_inr": round(total_revenue, 2),
        "total_valid_orders": len(valid_orders),
        "total_all_orders": len(orders),
        "average_order_value_inr": round(aov, 2),
        "excluded_invalid_orders": len(orders) - len(valid_orders)
    }


def identify_inactive_customers_tool(db: Session, min_days: int = 60, min_spent: float = 0.0) -> List[Dict[str, Any]]:
    """
    Find customers who have not placed an order in the last `min_days` days and have spent at least `min_spent` INR.
    """
    now = datetime.utcnow()
    customers = db.query(Customer).all()
    results = []

    for c in customers:
        valid_orders = [o for o in c.orders if o.status not in INVALID_ORDER_STATUSES]
        if not valid_orders:
            continue
            
        total_spent = sum(o.total for o in valid_orders)
        if total_spent < min_spent:
            continue

        sorted_orders = sorted(valid_orders, key=lambda x: x.date_created, reverse=True)
        last_order = sorted_orders[0]
        days_inactive = (now - last_order.date_created).days

        if days_inactive >= min_days:
            results.append({
                "customer_id": c.id,
                "name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "total_spent": round(total_spent, 2),
                "orders_count": len(valid_orders),
                "last_order_date": last_order.date_created.strftime("%Y-%m-%d"),
                "days_inactive": days_inactive,
                "last_order_items": [it.product_name for it in last_order.items]
            })

    results.sort(key=lambda x: x["total_spent"], reverse=True)
    return results


def identify_high_value_customers_tool(db: Session, min_spent: float = 10000.0) -> List[Dict[str, Any]]:
    """
    Find customers whose cumulative valid spend meets or exceeds `min_spent` INR.
    """
    customers = db.query(Customer).all()
    results = []

    for c in customers:
        valid_orders = [o for o in c.orders if o.status not in INVALID_ORDER_STATUSES]
        total_spent = sum(o.total for o in valid_orders)
        if total_spent >= min_spent:
            sorted_orders = sorted(valid_orders, key=lambda x: x.date_created, reverse=True)
            last_date = sorted_orders[0].date_created.strftime("%Y-%m-%d") if sorted_orders else None
            results.append({
                "customer_id": c.id,
                "name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "total_spent": round(total_spent, 2),
                "orders_count": len(valid_orders),
                "last_order_date": last_date
            })

    results.sort(key=lambda x: x["total_spent"], reverse=True)
    return results


# ACTION TOOLS
def create_followup_task_tool(
    db: Session,
    customer_id: int,
    title: str,
    description: Optional[str] = "",
    priority: str = "medium",
    due_days: int = 3,
    created_by: str = "AI Copilot"
) -> Dict[str, Any]:
    """
    Create a follow-up task for a validated customer.
    Checks for customer existence and prevents duplicate pending tasks.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return {"success": False, "error": f"Customer ID {customer_id} does not exist in CRM database."}

    # Check for duplicate pending task with same title
    existing = db.query(FollowUpTask).filter(
        FollowUpTask.customer_id == customer_id,
        FollowUpTask.title == title,
        FollowUpTask.status == "pending"
    ).first()

    if existing:
        return {
            "success": True,
            "task_id": existing.id,
            "message": f"Identical pending task already exists for {customer.full_name} (Task #{existing.id}).",
            "is_duplicate": True
        }

    due_date = datetime.utcnow() + timedelta(days=due_days)
    task = FollowUpTask(
        customer_id=customer_id,
        title=title,
        description=description,
        priority=priority.lower() if priority.lower() in ("low", "medium", "high") else "medium",
        due_date=due_date,
        status="pending",
        created_by=created_by,
        created_at=datetime.utcnow()
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return {
        "success": True,
        "task_id": task.id,
        "customer_id": customer.id,
        "customer_name": customer.full_name,
        "title": task.title,
        "priority": task.priority,
        "due_date": task.due_date.strftime("%Y-%m-%d"),
        "status": task.status
    }


def add_customer_note_tool(db: Session, customer_id: int, content: str, created_by: str = "AI Copilot") -> Dict[str, Any]:
    """
    Add an internal note to a customer profile.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return {"success": False, "error": f"Customer ID {customer_id} not found."}

    note = CustomerNote(
        customer_id=customer_id,
        content=content,
        created_by=created_by,
        created_at=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "success": True,
        "note_id": note.id,
        "customer_id": customer.id,
        "customer_name": customer.full_name,
        "content": note.content,
        "created_at": note.created_at.strftime("%Y-%m-%d %H:%M")
    }


def update_task_status_tool(db: Session, task_id: int, status: str) -> Dict[str, Any]:
    """
    Update the status of a follow-up task (e.g., 'completed', 'pending', 'cancelled').
    """
    task = db.query(FollowUpTask).filter(FollowUpTask.id == task_id).first()
    if not task:
        return {"success": False, "error": f"Task ID {task_id} not found."}

    valid_statuses = ("pending", "completed", "cancelled")
    if status.lower() not in valid_statuses:
        return {"success": False, "error": f"Invalid status '{status}'. Must be one of: {', '.join(valid_statuses)}"}

    task.status = status.lower()
    if task.status == "completed":
        task.completed_at = datetime.utcnow()
    else:
        task.completed_at = None

    db.commit()
    db.refresh(task)

    return {
        "success": True,
        "task_id": task.id,
        "status": task.status,
        "completed_at": task.completed_at.strftime("%Y-%m-%d %H:%M") if task.completed_at else None
    }
