from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Customer, CustomerNote, Order
from app.schemas import (
    CustomerSummarySchema, CustomerDetailSchema, CustomerNoteSchema,
    CustomerNoteCreate, OrderSchema
)
from app.services.crm_service import (
    get_all_customers_summary, get_customer_360, export_customers_to_csv
)

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("")
def list_customers(
    search: Optional[str] = Query(None, description="Search by name, email, phone, city"),
    segment: Optional[str] = Query(None, description="Filter by segment"),
    sort_by: Optional[str] = Query("total_spent", description="total_spent, orders_count, name, last_order_date"),
    sort_order: Optional[str] = Query("desc", description="asc or desc"),
    export: Optional[str] = Query(None, description="Set to 'csv' for CSV export"),
    db: Session = Depends(get_db)
):
    customers = get_all_customers_summary(
        db, search=search, segment=segment, sort_by=sort_by, sort_order=sort_order
    )

    if export == "csv":
        csv_data = export_customers_to_csv(customers)
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=customers_export.csv"}
        )

    return customers


@router.get("/{customer_id}", response_model=CustomerDetailSchema)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    detail = get_customer_360(db, customer_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Customer #{customer_id} not found")
    return detail


@router.get("/{customer_id}/orders", response_model=List[OrderSchema])
def get_customer_orders(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Return customer's orders
    orders = db.query(Order).filter(Order.customer_id == customer_id).order_by(Order.date_created.desc()).all()
    res = []
    for o in orders:
        res.append(OrderSchema(
            id=o.id,
            woo_id=o.woo_id,
            customer_id=o.customer_id,
            customer_name=customer.full_name,
            customer_email=customer.email,
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
            items=[{
                "id": it.id,
                "product_name": it.product_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "total_price": it.total_price,
                "sku": it.sku
            } for it in o.items]
        ))
    return res


@router.get("/{customer_id}/notes", response_model=List[CustomerNoteSchema])
def get_customer_notes(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    notes = db.query(CustomerNote).filter(CustomerNote.customer_id == customer_id).order_by(CustomerNote.created_at.desc()).all()
    return notes


@router.post("/{customer_id}/notes", response_model=CustomerNoteSchema)
def create_customer_note(customer_id: int, note_data: CustomerNoteCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    new_note = CustomerNote(
        customer_id=customer_id,
        content=note_data.content,
        created_by=note_data.created_by or "CRM Agent"
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    return new_note
