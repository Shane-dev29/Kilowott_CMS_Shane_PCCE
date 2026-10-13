from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.seed_data import seed_database
from app.routers import dashboard, customers, orders, tasks, sync, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed initial demo dataset if empty
    db = SessionLocal()
    try:
        seed_database(db, force=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Agentic AI-Powered WooCommerce CRM Backend with LangGraph orchestration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "llm_provider": settings.LLM_PROVIDER,
        "woocommerce_configured": bool(settings.WOOCOMMERCE_STORE_URL and settings.WOOCOMMERCE_CONSUMER_KEY)
    }

# Mount Routers
app.include_router(dashboard.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(tasks.router)
app.include_router(sync.router)
app.include_router(ai.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
