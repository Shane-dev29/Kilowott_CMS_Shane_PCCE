from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import Order
from app.schemas import OrderSchema, OrderItemSchema

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.get("", response_model=List[OrderSchema])
def list_orders(
    search: Optional[str] = Query(None, description="Search by order number, customer name, email"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    db: Session = Depends(get_db)
):
    query = db.query(Order)

    if status and status.lower() != "all":
        query = query.filter(Order.status == status.lower())

    if customer_id:
        query = query.filter(Order.customer_id == customer_id)

    orders = query.order_by(Order.date_created.desc()).all()

    results = []
    s = search.lower() if search else None

    for o in orders:
        c_name = o.customer.full_name if o.customer else (o.guest_name or "Guest")
        c_email = o.customer.email if o.customer else (o.guest_email or "")

        if s:
            match_num = s in o.order_number.lower()
            match_name = s in c_name.lower()
            match_email = s in c_email.lower()
            if not (match_num or match_name or match_email):
                continue

        results.append(OrderSchema(
            id=o.id,
            woo_id=o.woo_id,
            customer_id=o.customer_id,
            customer_name=c_name,
            customer_email=c_email,
            guest_name=o.guest_name,
            guest_email=o.guest_email,
            order_number=o.order_number,
            status=o.status,
            total=o.total,
            subtotal=o.subtotal,
            tax_total=o.tax_total,
            shipping_total=o.shipping_total,
            currency=o.currency,
            date_created=o.date_created,
            date_completed=o.date_completed,
            payment_method=o.payment_method,
            is_demo=o.is_demo,
            items_count=len(o.items),
            items=[
                OrderItemSchema(
                    id=it.id,
                    product_name=it.product_name,
                    quantity=it.quantity,
                    unit_price=it.unit_price,
                    total_price=it.total_price,
                    sku=it.sku
                ) for it in o.items
            ]
        ))

    return results


@router.get("/{order_id}", response_model=OrderSchema)
def get_order(order_id: int, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")

    c_name = o.customer.full_name if o.customer else (o.guest_name or "Guest")
    c_email = o.customer.email if o.customer else (o.guest_email or "")

    return OrderSchema(
        id=o.id,
        woo_id=o.woo_id,
        customer_id=o.customer_id,
        customer_name=c_name,
        customer_email=c_email,
        guest_name=o.guest_name,
        guest_email=o.guest_email,
        order_number=o.order_number,
        status=o.status,
        total=o.total,
        subtotal=o.subtotal,
        tax_total=o.tax_total,
        shipping_total=o.shipping_total,
        currency=o.currency,
        date_created=o.date_created,
        date_completed=o.date_completed,
        payment_method=o.payment_method,
        is_demo=o.is_demo,
        items_count=len(o.items),
        items=[
            OrderItemSchema(
                id=it.id,
                product_name=it.product_name,
                quantity=it.quantity,
                unit_price=it.unit_price,
                total_price=it.total_price,
                sku=it.sku
            ) for it in o.items
        ]
    )
