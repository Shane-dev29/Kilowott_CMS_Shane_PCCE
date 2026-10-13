from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import DashboardSummarySchema
from app.services.crm_service import get_dashboard_summary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummarySchema)
def get_summary(db: Session = Depends(get_db)):
    return get_dashboard_summary(db)

@router.get("/revenue")
def get_revenue(db: Session = Depends(get_db)):
    summary = get_dashboard_summary(db)
    return {
        "total_revenue": summary.total_revenue,
        "average_order_value": summary.average_order_value,
        "revenue_trends": summary.revenue_trends,
        "status_distribution": summary.status_distribution
    }
