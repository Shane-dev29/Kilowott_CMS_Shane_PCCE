from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SyncLog
from app.schemas import SyncTestResponse, SyncRunResponse, SyncLogSchema
from app.services.woocommerce import woocommerce_service

router = APIRouter(prefix="/api/sync", tags=["Sync"])

@router.post("/test-connection", response_model=SyncTestResponse)
async def test_connection():
    result = await woocommerce_service.test_connection()
    return SyncTestResponse(
        success=result["success"],
        message=result["message"],
        store_url=result.get("store_url"),
        details=result.get("details")
    )


@router.post("/run", response_model=SyncRunResponse)
async def run_sync(
    mode: Optional[str] = Query("auto", description="'live', 'demo', or 'auto' (live if configured, else demo)"),
    db: Session = Depends(get_db)
):
    if mode == "live" or (mode == "auto" and woocommerce_service.is_configured()):
        success, message, cust_count, order_count = await woocommerce_service.sync_live_store(db)
        is_demo = False
    else:
        success, message, cust_count, order_count = woocommerce_service.sync_demo_mode(db)
        is_demo = True

    latest_log = db.query(SyncLog).order_by(SyncLog.started_at.desc()).first()
    log_id = latest_log.id if latest_log else 0

    return SyncRunResponse(
        success=success,
        message=message,
        customers_synced=cust_count,
        orders_synced=order_count,
        is_demo=is_demo,
        log_id=log_id
    )


@router.get("/history", response_model=List[SyncLogSchema])
def get_sync_history(db: Session = Depends(get_db)):
    logs = db.query(SyncLog).order_by(SyncLog.started_at.desc()).limit(20).all()
    return logs
