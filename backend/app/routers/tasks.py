from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import FollowUpTask, Customer
from app.schemas import FollowUpTaskSchema, FollowUpTaskCreate, FollowUpTaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=List[FollowUpTaskSchema])
def list_tasks(
    status: Optional[str] = Query(None, description="pending, completed, cancelled"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    priority: Optional[str] = Query(None, description="low, medium, high"),
    db: Session = Depends(get_db)
):
    query = db.query(FollowUpTask)
    if status and status.lower() != "all":
        query = query.filter(FollowUpTask.status == status.lower())
    if customer_id:
        query = query.filter(FollowUpTask.customer_id == customer_id)
    if priority and priority.lower() != "all":
        query = query.filter(FollowUpTask.priority == priority.lower())

    tasks = query.order_by(FollowUpTask.created_at.desc()).all()
    results = []
    for t in tasks:
        c_name = t.customer.full_name if t.customer else "Unknown Customer"
        c_email = t.customer.email if t.customer else ""
        results.append(FollowUpTaskSchema(
            id=t.id,
            customer_id=t.customer_id,
            customer_name=c_name,
            customer_email=c_email,
            title=t.title,
            description=t.description,
            priority=t.priority,
            due_date=t.due_date,
            status=t.status,
            created_at=t.created_at,
            completed_at=t.completed_at,
            created_by=t.created_by
        ))
    return results


@router.post("", response_model=FollowUpTaskSchema)
def create_task(task_data: FollowUpTaskCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == task_data.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    new_task = FollowUpTask(
        customer_id=task_data.customer_id,
        title=task_data.title,
        description=task_data.description or "",
        priority=task_data.priority or "medium",
        due_date=task_data.due_date,
        status="pending",
        created_by=task_data.created_by or "CRM Agent",
        created_at=datetime.utcnow()
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return FollowUpTaskSchema(
        id=new_task.id,
        customer_id=new_task.customer_id,
        customer_name=customer.full_name,
        customer_email=customer.email,
        title=new_task.title,
        description=new_task.description,
        priority=new_task.priority,
        due_date=new_task.due_date,
        status=new_task.status,
        created_at=new_task.created_at,
        completed_at=new_task.completed_at,
        created_by=new_task.created_by
    )


@router.patch("/{task_id}", response_model=FollowUpTaskSchema)
def update_task(task_id: int, update_data: FollowUpTaskUpdate, db: Session = Depends(get_db)):
    task = db.query(FollowUpTask).filter(FollowUpTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if update_data.title is not None:
        task.title = update_data.title
    if update_data.description is not None:
        task.description = update_data.description
    if update_data.priority is not None:
        task.priority = update_data.priority.lower()
    if update_data.due_date is not None:
        task.due_date = update_data.due_date
    if update_data.status is not None:
        task.status = update_data.status.lower()
        if task.status == "completed":
            task.completed_at = datetime.utcnow()
        elif task.status == "pending":
            task.completed_at = None

    db.commit()
    db.refresh(task)

    c_name = task.customer.full_name if task.customer else "Unknown Customer"
    c_email = task.customer.email if task.customer else ""

    return FollowUpTaskSchema(
        id=task.id,
        customer_id=task.customer_id,
        customer_name=c_name,
        customer_email=c_email,
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        status=task.status,
        created_at=task.created_at,
        completed_at=task.completed_at,
        created_by=task.created_by
    )
