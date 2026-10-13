import io
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from app.models import Customer, Order, OrderItem, CustomerNote, FollowUpTask, SyncLog
from app.schemas import (
    CustomerSummarySchema, CustomerDetailSchema, OrderSchema, OrderItemSchema,
    CustomerNoteSchema, FollowUpTaskSchema, TimelineEvent, DashboardSummarySchema
)

VALID_ORDER_STATUSES = ("completed", "processing", "pending", "on-hold")
INVALID_ORDER_STATUSES = ("cancelled", "failed", "refunded")

def calculate_segment(orders_count: int, total_spent: float, last_order_date: Optional[datetime]) -> str:
    """
    Segmentation rules:
    - High-Value: total_spent >= 15,000 INR
    - Inactive: placed orders previously, but none in the last 60 days
    - Returning: >= 2 orders placed
    - New: 1 order placed within last 30 days
    - Lead: 0 orders
    """
    now = datetime.utcnow()
    
    if orders_count == 0:
        return "Lead"
    
    # Check inactivity first if they haven't ordered in 60 days
    if last_order_date and (now - last_order_date).days > 60:
        return "Inactive"
        
    if total_spent >= 15000:
        return "High-Value"
        
    if orders_count >= 2:
        return "Returning"
        
    return "New"


def calculate_rfm_and_health(customer: Customer, valid_orders: List[Order]):
    """
    Computes:
    1. RFM Metrics (Recency, Frequency, Monetary)
    2. RFM Segment (Champions, Loyal Customers, Potential Loyalists, At Risk, Hibernating, New Leads)
    3. Churn Risk (Low, Medium, High, Critical)
    4. Customer Health Score (0-100)
    """
    now = datetime.utcnow()
    orders_count = len(valid_orders)
    total_spent = sum(o.total for o in valid_orders)

    sorted_valid = sorted(valid_orders, key=lambda o: o.date_created, reverse=True)
    last_valid_date = sorted_valid[0].date_created if sorted_valid else None
    recency_days = (now - last_valid_date).days if last_valid_date else None

    # RFM Segment
    if orders_count == 0:
        rfm_segment = "New Leads"
        churn_risk = "Low"
        health_score = 50
    else:
        # Segment logic
        if total_spent >= 25000 and (recency_days is not None and recency_days <= 60):
            rfm_segment = "Champions"
        elif orders_count >= 3 and (recency_days is not None and recency_days <= 75):
            rfm_segment = "Loyal Customers"
        elif total_spent >= 5000 and (recency_days is not None and recency_days <= 45):
            rfm_segment = "Potential Loyalists"
        elif total_spent >= 10000 and (recency_days is not None and recency_days > 60):
            rfm_segment = "At Risk"
        elif recency_days is not None and recency_days > 90:
            rfm_segment = "Hibernating"
        else:
            rfm_segment = "Potential Loyalists"

        # Churn Risk
        if recency_days is not None and recency_days > 120 and total_spent >= 20000:
            churn_risk = "Critical"
        elif recency_days is not None and (recency_days > 90 or (recency_days > 60 and total_spent >= 10000)):
            churn_risk = "High"
        elif recency_days is not None and recency_days > 45:
            churn_risk = "Medium"
        else:
            churn_risk = "Low"

        # Health Score (0 - 100)
        h_score = 50
        # Recency impact
        if recency_days is not None:
            if recency_days <= 15:
                h_score += 25
            elif recency_days <= 30:
                h_score += 15
            elif recency_days <= 60:
                h_score += 5
            elif recency_days <= 90:
                h_score -= 10
            elif recency_days <= 120:
                h_score -= 25
            else:
                h_score -= 35

        # Frequency impact
        if orders_count >= 4:
            h_score += 20
        elif orders_count >= 2:
            h_score += 10
        elif orders_count == 1:
            h_score += 5

        # Monetary impact
        if total_spent >= 30000:
            h_score += 15
        elif total_spent >= 15000:
            h_score += 10
        elif total_spent >= 5000:
            h_score += 5

        # Penalty for bad orders (failed, refunded, cancelled)
        bad_orders = [o for o in customer.orders if o.status in ("failed", "refunded", "cancelled")]
        if bad_orders:
            h_score -= 15 * len(bad_orders)

        health_score = max(5, min(100, h_score))

    rfm_scores = {
        "recency_days": recency_days,
        "frequency_orders": orders_count,
        "monetary_spent": round(total_spent, 2),
        "r_score": 5 if (recency_days and recency_days <= 15) else (4 if (recency_days and recency_days <= 45) else (3 if (recency_days and recency_days <= 75) else (2 if (recency_days and recency_days <= 120) else 1))),
        "f_score": 5 if orders_count >= 4 else (4 if orders_count == 3 else (3 if orders_count == 2 else (2 if orders_count == 1 else 1))),
        "m_score": 5 if total_spent >= 30000 else (4 if total_spent >= 15000 else (3 if total_spent >= 5000 else (2 if total_spent >= 1000 else 1)))
    }

    return rfm_segment, churn_risk, health_score, recency_days, rfm_scores


def get_customer_summary(customer: Customer) -> CustomerSummarySchema:
    valid_orders = [o for o in customer.orders if o.status not in INVALID_ORDER_STATUSES]
    orders_count = len(valid_orders)
    total_spent = sum(o.total for o in valid_orders)
    
    last_order_date = None
    if valid_orders:
        sorted_orders = sorted(valid_orders, key=lambda o: o.date_created, reverse=True)
        last_order_date = sorted_orders[0].date_created
        
    segment = calculate_segment(orders_count, total_spent, last_order_date)
    rfm_segment, churn_risk, health_score, recency_days, _ = calculate_rfm_and_health(customer, valid_orders)
    
    return CustomerSummarySchema(
        id=customer.id,
        woo_id=customer.woo_id,
        first_name=customer.first_name,
        last_name=customer.last_name,
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone,
        city=customer.city,
        state=customer.state,
        country=customer.country,
        orders_count=orders_count,
        total_spent=round(total_spent, 2),
        last_order_date=last_order_date,
        segment=segment,
        rfm_segment=rfm_segment,
        churn_risk=churn_risk,
        health_score=health_score,
        recency_days=recency_days,
        custom_tags=customer.custom_tags or "",
        is_demo=customer.is_demo
    )


def get_all_customers_summary(
    db: Session,
    search: Optional[str] = None,
    segment: Optional[str] = None,
    rfm_segment: Optional[str] = None,
    churn_risk: Optional[str] = None,
    sort_by: Optional[str] = "total_spent",
    sort_order: Optional[str] = "desc"
) -> List[CustomerSummarySchema]:
    customers = db.query(Customer).all()
    results = [get_customer_summary(c) for c in customers]

    if search:
        s = search.lower()
        results = [
            c for c in results
            if s in c.full_name.lower() or s in c.email.lower() or (c.phone and s in c.phone.lower()) or (c.city and s in c.city.lower())
        ]

    if segment and segment.lower() != "all":
        results = [c for c in results if c.segment.lower() == segment.lower()]

    if rfm_segment and rfm_segment.lower() != "all":
        results = [c for c in results if c.rfm_segment and c.rfm_segment.lower() == rfm_segment.lower()]

    if churn_risk and churn_risk.lower() != "all":
        results = [c for c in results if c.churn_risk and c.churn_risk.lower() == churn_risk.lower()]

    # Sorting
    reverse = (sort_order.lower() == "desc")
    if sort_by == "total_spent":
        results.sort(key=lambda x: x.total_spent, reverse=reverse)
    elif sort_by == "orders_count":
        results.sort(key=lambda x: x.orders_count, reverse=reverse)
    elif sort_by == "health_score":
        results.sort(key=lambda x: x.health_score or 0, reverse=reverse)
    elif sort_by == "recency_days":
        results.sort(key=lambda x: x.recency_days if x.recency_days is not None else 9999, reverse=reverse)
    elif sort_by == "name":
        results.sort(key=lambda x: x.full_name.lower(), reverse=reverse)
    elif sort_by == "last_order_date":
        results.sort(key=lambda x: x.last_order_date or datetime.min, reverse=reverse)

    return results


def get_rfm_summary(db: Session) -> Dict[str, Any]:
    customers = db.query(Customer).all()
    summaries = [get_customer_summary(c) for c in customers]
    
    seg_dist: Dict[str, int] = {}
    churn_dist: Dict[str, int] = {}
    health_scores = []
    revenue_at_risk = 0.0
    high_risk_list = []

    for s in summaries:
        seg_dist[s.rfm_segment] = seg_dist.get(s.rfm_segment, 0) + 1
        churn_dist[s.churn_risk] = churn_dist.get(s.churn_risk, 0) + 1
        if s.health_score is not None:
            health_scores.append(s.health_score)
        
        if s.churn_risk in ("Critical", "High") and s.total_spent > 0:
            revenue_at_risk += s.total_spent
            high_risk_list.append({
                "customer_id": s.id,
                "name": s.full_name,
                "email": s.email,
                "total_spent": s.total_spent,
                "churn_risk": s.churn_risk,
                "health_score": s.health_score,
                "recency_days": s.recency_days,
                "rfm_segment": s.rfm_segment
            })

    attention_orders = db.query(Order).filter(Order.status.in_(("failed", "on-hold", "pending"))).all()
    attention_orders_total = sum(o.total for o in attention_orders)
    total_rev_at_risk = revenue_at_risk + attention_orders_total

    avg_health = (sum(health_scores) / len(health_scores)) if health_scores else 70.0
    high_risk_list.sort(key=lambda x: x["total_spent"], reverse=True)

    return {
        "total_customers": len(customers),
        "segments_distribution": seg_dist,
        "churn_risk_distribution": churn_dist,
        "average_health_score": round(avg_health, 1),
        "revenue_at_risk": round(total_rev_at_risk, 2),
        "attention_orders_count": len(attention_orders),
        "attention_orders_value": round(attention_orders_total, 2),
        "high_risk_customers": high_risk_list[:10]
    }



def get_customer_360(db: Session, customer_id: int) -> Optional[CustomerDetailSchema]:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return None

    valid_orders = [o for o in customer.orders if o.status not in INVALID_ORDER_STATUSES]
    orders_count = len(valid_orders)
    total_spent = sum(o.total for o in valid_orders)
    aov = (total_spent / orders_count) if orders_count > 0 else 0.0

    all_sorted_orders = sorted(customer.orders, key=lambda o: o.date_created, reverse=True)
    last_order_date = all_sorted_orders[0].date_created if all_sorted_orders else None
    first_order_date = all_sorted_orders[-1].date_created if all_sorted_orders else None
    segment = calculate_segment(orders_count, total_spent, last_order_date)
    rfm_segment, churn_risk, health_score, recency_days, rfm_scores = calculate_rfm_and_health(customer, valid_orders)


    # Order schemas
    order_schemas = []
    for ord_obj in all_sorted_orders:
        item_schemas = [
            OrderItemSchema(
                id=it.id,
                product_name=it.product_name,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=it.total_price,
                sku=it.sku
            ) for it in ord_obj.items
        ]
        order_schemas.append(
            OrderSchema(
                id=ord_obj.id,
                woo_id=ord_obj.woo_id,
                customer_id=ord_obj.customer_id,
                customer_name=customer.full_name,
                customer_email=customer.email,
                order_number=ord_obj.order_number,
                status=ord_obj.status,
                total=ord_obj.total,
                subtotal=ord_obj.subtotal,
                tax_total=ord_obj.tax_total,
                shipping_total=ord_obj.shipping_total,
                currency=ord_obj.currency,
                date_created=ord_obj.date_created,
                date_completed=ord_obj.date_completed,
                payment_method=ord_obj.payment_method,
                is_demo=ord_obj.is_demo,
                items_count=len(ord_obj.items),
                items=item_schemas
            )
        )

    # Note schemas
    note_schemas = [
        CustomerNoteSchema(
            id=n.id,
            customer_id=n.customer_id,
            content=n.content,
            created_by=n.created_by,
            created_at=n.created_at
        ) for n in sorted(customer.notes, key=lambda x: x.created_at, reverse=True)
    ]

    # Task schemas
    task_schemas = [
        FollowUpTaskSchema(
            id=t.id,
            customer_id=t.customer_id,
            customer_name=customer.full_name,
            customer_email=customer.email,
            title=t.title,
            description=t.description,
            priority=t.priority,
            due_date=t.due_date,
            status=t.status,
            created_at=t.created_at,
            completed_at=t.completed_at,
            created_by=t.created_by
        ) for t in sorted(customer.tasks, key=lambda x: x.created_at, reverse=True)
    ]

    # Combined Timeline
    timeline_events: List[TimelineEvent] = []
    
    for ord_obj in all_sorted_orders:
        timeline_events.append(TimelineEvent(
            id=f"order-{ord_obj.id}",
            type="order",
            title=f"Order {ord_obj.order_number} ({ord_obj.status})",
            description=f"Total: ₹{ord_obj.total:,.2f} • {len(ord_obj.items)} item(s) • Paid via {ord_obj.payment_method}",
            timestamp=ord_obj.date_created,
            meta={"order_id": ord_obj.id, "total": ord_obj.total, "status": ord_obj.status}
        ))

    for note in customer.notes:
        timeline_events.append(TimelineEvent(
            id=f"note-{note.id}",
            type="note",
            title=f"Note by {note.created_by}",
            description=note.content,
            timestamp=note.created_at,
            meta={"note_id": note.id, "created_by": note.created_by}
        ))

    for task in customer.tasks:
        timeline_events.append(TimelineEvent(
            id=f"task-{task.id}",
            type="task",
            title=f"Task: {task.title}",
            description=f"Priority: {task.priority.capitalize()} • Status: {task.status.capitalize()}" + (f" • {task.description}" if task.description else ""),
            timestamp=task.completed_at if task.status == "completed" and task.completed_at else task.created_at,
            meta={"task_id": task.id, "priority": task.priority, "status": task.status}
        ))

    timeline_events.sort(key=lambda e: e.timestamp, reverse=True)

    return CustomerDetailSchema(
        id=customer.id,
        woo_id=customer.woo_id,
        first_name=customer.first_name,
        last_name=customer.last_name,
        full_name=customer.full_name,
        email=customer.email,
        phone=customer.phone,
        address_line1=customer.address_line1,
        city=customer.city,
        state=customer.state,
        country=customer.country,
        postcode=customer.postcode,
        created_at=customer.created_at,
        is_demo=customer.is_demo,
        custom_tags=customer.custom_tags or "",
        orders_count=orders_count,
        total_spent=round(total_spent, 2),
        average_order_value=round(aov, 2),
        first_order_date=first_order_date,
        last_order_date=last_order_date,
        segment=segment,
        rfm_segment=rfm_segment,
        churn_risk=churn_risk,
        health_score=health_score,
        recency_days=recency_days,
        rfm_scores=rfm_scores,
        orders=order_schemas,
        notes=note_schemas,
        tasks=task_schemas,
        timeline=timeline_events
    )


def get_dashboard_summary(db: Session) -> DashboardSummarySchema:
    total_customers = db.query(Customer).count()
    all_orders = db.query(Order).all()
    total_orders = len(all_orders)

    # Revenue calculation excluding cancelled, failed, refunded
    valid_orders = [o for o in all_orders if o.status not in INVALID_ORDER_STATUSES]
    total_revenue = sum(o.total for o in valid_orders)
    aov = (total_revenue / len(valid_orders)) if valid_orders else 0.0

    # Returning customer rate
    # Returning customer = customer with >= 2 valid orders
    customer_order_counts: Dict[int, int] = {}
    for o in valid_orders:
        if o.customer_id:
            customer_order_counts[o.customer_id] = customer_order_counts.get(o.customer_id, 0) + 1
    
    customers_with_orders = len(customer_order_counts)
    returning_customers = sum(1 for cnt in customer_order_counts.values() if cnt >= 2)
    returning_rate = ((returning_customers / customers_with_orders) * 100) if customers_with_orders > 0 else 0.0

    # Pending tasks
    pending_tasks_count = db.query(FollowUpTask).filter(FollowUpTask.status == "pending").count()

    # Order status distribution
    status_distribution: Dict[str, int] = {}
    for o in all_orders:
        status_distribution[o.status] = status_distribution.get(o.status, 0) + 1

    # Revenue trends over time (group by month over the past 6 months)
    revenue_trends = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        # Month start and end
        month_target = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_label = month_target.strftime("%b %Y")
        
        # Calculate revenue for that month
        month_orders = [
            o for o in valid_orders
            if o.date_created.year == month_target.year and o.date_created.month == month_target.month
        ]
        m_rev = sum(o.total for o in month_orders)
        revenue_trends.append({
            "month": month_label,
            "revenue": round(m_rev, 2),
            "orders": len(month_orders)
        })

    # Recent orders (top 6)
    sorted_orders = sorted(all_orders, key=lambda o: o.date_created, reverse=True)[:6]
    recent_order_schemas = []
    for ord_obj in sorted_orders:
        c_name = ord_obj.customer.full_name if ord_obj.customer else (ord_obj.guest_name or "Guest")
        c_email = ord_obj.customer.email if ord_obj.customer else (ord_obj.guest_email or "")
        recent_order_schemas.append(OrderSchema(
            id=ord_obj.id,
            woo_id=ord_obj.woo_id,
            customer_id=ord_obj.customer_id,
            customer_name=c_name,
            customer_email=c_email,
            guest_name=ord_obj.guest_name,
            guest_email=ord_obj.guest_email,
            order_number=ord_obj.order_number,
            status=ord_obj.status,
            total=ord_obj.total,
            subtotal=ord_obj.subtotal,
            tax_total=ord_obj.tax_total,
            shipping_total=ord_obj.shipping_total,
            currency=ord_obj.currency,
            date_created=ord_obj.date_created,
            date_completed=ord_obj.date_completed,
            payment_method=ord_obj.payment_method,
            is_demo=ord_obj.is_demo,
            items_count=len(ord_obj.items),
            items=[]
        ))

    # Recent activity feed
    recent_activity: List[TimelineEvent] = []
    for ord_obj in sorted_orders[:4]:
        c_name = ord_obj.customer.full_name if ord_obj.customer else (ord_obj.guest_name or "Guest")
        recent_activity.append(TimelineEvent(
            id=f"act-ord-{ord_obj.id}",
            type="order",
            title=f"Order {ord_obj.order_number} by {c_name}",
            description=f"₹{ord_obj.total:,.2f} • {ord_obj.status.capitalize()} • {len(ord_obj.items)} item(s)",
            timestamp=ord_obj.date_created
        ))
    
    recent_notes = db.query(CustomerNote).order_by(desc(CustomerNote.created_at)).limit(3).all()
    for note in recent_notes:
        c_name = note.customer.full_name if note.customer else "Customer"
        recent_activity.append(TimelineEvent(
            id=f"act-note-{note.id}",
            type="note",
            title=f"Note on {c_name}",
            description=f'"{note.content[:80]}..." - by {note.created_by}',
            timestamp=note.created_at
        ))

    recent_tasks = db.query(FollowUpTask).order_by(desc(FollowUpTask.created_at)).limit(3).all()
    for t in recent_tasks:
        c_name = t.customer.full_name if t.customer else "Customer"
        recent_activity.append(TimelineEvent(
            id=f"act-task-{t.id}",
            type="task",
            title=f"Task: {t.title}",
            description=f"For {c_name} • Priority: {t.priority.capitalize()} • Status: {t.status.capitalize()}",
            timestamp=t.created_at
        ))

    recent_activity.sort(key=lambda a: a.timestamp, reverse=True)

    # Sync info
    last_log = db.query(SyncLog).order_by(desc(SyncLog.started_at)).first()
    is_demo_mode = True
    last_sync = None
    if last_log:
        is_demo_mode = last_log.is_demo_sync
        last_sync = last_log.finished_at or last_log.started_at

    return DashboardSummarySchema(
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        average_order_value=round(aov, 2),
        returning_customer_rate=round(returning_rate, 1),
        pending_tasks_count=pending_tasks_count,
        is_demo_mode=is_demo_mode,
        last_sync=last_sync,
        recent_orders=recent_order_schemas,
        status_distribution=status_distribution,
        revenue_trends=revenue_trends,
        recent_activity=recent_activity[:8]
    )


def export_customers_to_csv(customers: List[CustomerSummarySchema]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Customer ID", "Woo ID", "Name", "Email", "Phone", "City", "State",
        "Orders Count", "Total Spent (INR)", "Last Order Date", "Segment", "Tags", "Is Demo"
    ])
    for c in customers:
        writer.writerow([
            c.id,
            c.woo_id or "",
            c.full_name,
            c.email,
            c.phone or "",
            c.city or "",
            c.state or "",
            c.orders_count,
            f"{c.total_spent:.2f}",
            c.last_order_date.strftime("%Y-%m-%d %H:%M:%S") if c.last_order_date else "Never",
            c.segment,
            c.custom_tags or "",
            "Yes" if c.is_demo else "No"
        ])
    return output.getvalue()


def generate_store_insights(db: Session, use_llm: bool = True) -> Dict[str, Any]:
    """
    Synthesizes executive store analytics, revenue at risk, churn danger accounts,
    and priority actions for the AI Store Insights dashboard.
    """
    rfm = get_rfm_summary(db)
    attention_orders = db.query(Order).filter(Order.status.in_(("failed", "on-hold", "pending"))).order_by(Order.date_created.desc()).all()
    now = datetime.utcnow()

    # Formatted attention orders list
    stalled_orders = []
    recovery_value = 0.0
    for o in attention_orders:
        c_name = o.customer.full_name if o.customer else (o.guest_name or "Guest")
        c_email = o.customer.email if o.customer else (o.guest_email or "")
        age_hours = int((now - o.date_created).total_seconds() // 3600)
        age_days = age_hours // 24
        age_label = f"{age_days}d ago" if age_days > 0 else f"{age_hours}h ago"
        recovery_value += o.total

        stalled_orders.append({
            "order_id": o.id,
            "order_number": o.order_number,
            "customer_id": o.customer_id,
            "customer_name": c_name,
            "customer_email": c_email,
            "status": o.status,
            "total": o.total,
            "payment_method": o.payment_method,
            "age_label": age_label,
            "date": o.date_created.strftime("%Y-%m-%d %H:%M")
        })

    # High-Risk Churn accounts
    churn_accounts = rfm.get("high_risk_customers", [])
    churn_danger_count = len(churn_accounts)
    churn_danger_value = sum(c["total_spent"] for c in churn_accounts)

    # Priority Action Cards
    priority_actions = []
    action_idx = 1

    # 1. Stalled high-value orders
    for so in stalled_orders[:3]:
        prio = "urgent" if so["status"] == "failed" or so["total"] > 15000 else "high"
        desc = (
            f"Order {so['order_number']} (₹{so['total']:,.2f}) failed at payment gateway. Send 1-click UPI recovery link to salvage transaction."
            if so["status"] == "failed"
            else f"Order {so['order_number']} (₹{so['total']:,.2f}) placed via {so['payment_method']} is awaiting verification ({so['age_label']})."
        )
        priority_actions.append({
            "id": f"act-{action_idx}",
            "type": "payment_recovery",
            "title": f"Payment Recovery: {so['customer_name']} ({so['order_number']})",
            "customer_id": so["customer_id"],
            "customer_name": so["customer_name"],
            "impact": f"₹{so['total']:,.2f} Recoverable",
            "urgency": prio,
            "recommended_action": desc,
            "order_id": so["order_id"],
            "order_number": so["order_number"]
        })
        action_idx += 1

    # 2. VIP Churn win-backs
    for ca in churn_accounts[:3]:
        priority_actions.append({
            "id": f"act-{action_idx}",
            "type": "vip_winback",
            "title": f"VIP Win-Back: {ca['name']} ({ca['churn_risk']} Risk)",
            "customer_id": ca["customer_id"],
            "customer_name": ca["name"],
            "impact": f"₹{ca['total_spent']:,.2f} Historical LTV",
            "urgency": "critical" if ca["churn_risk"] == "Critical" else "high",
            "recommended_action": f"Customer inactive for {ca['recency_days']} days. Send tailored executive win-back voucher and concierge outreach.",
            "recency_days": ca["recency_days"]
        })
        action_idx += 1

    # Dynamic Executive Summary
    summary_text = (
        f"Store health stands at an average of {rfm['average_health_score']}/100 across {rfm['total_customers']} accounts. "
        f"Critical attention is required for ₹{rfm['revenue_at_risk']:,.2f} in total revenue at risk, comprising "
        f"{len(stalled_orders)} stalled/failed transactions (₹{recovery_value:,.2f}) and {churn_danger_count} at-risk customer relationships "
        f"(₹{churn_danger_value:,.2f} historical volume). "
        f"Executing the {len(priority_actions)} highlighted priority interventions could immediately rescue up to ₹{recovery_value:,.2f} "
        f"in direct checkout capital while restoring engagement with high-value brand advocates."
    )

    return {
        "revenue_at_risk": rfm["revenue_at_risk"],
        "recovery_opportunity_value": round(recovery_value, 2),
        "churn_danger_count": churn_danger_count,
        "churn_danger_value": round(churn_danger_value, 2),
        "average_health_score": rfm["average_health_score"],
        "executive_summary": summary_text,
        "priority_actions": priority_actions,
        "stalled_orders": stalled_orders,
        "segments_distribution": rfm["segments_distribution"],
        "churn_risk_distribution": rfm["churn_risk_distribution"],
        "generated_at": now.strftime("%Y-%m-%d %H:%M:%S")
    }

