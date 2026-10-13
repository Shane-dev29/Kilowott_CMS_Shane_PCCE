from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
)
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    woo_id = Column(Integer, unique=True, nullable=True, index=True)
    first_name = Column(String(100), nullable=False, default="")
    last_name = Column(String(100), nullable=False, default="")
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True, default="")
    address_line1 = Column(String(255), nullable=True, default="")
    city = Column(String(100), nullable=True, default="")
    state = Column(String(100), nullable=True, default="")
    country = Column(String(100), nullable=True, default="IN")
    postcode = Column(String(20), nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_demo = Column(Boolean, default=True)
    custom_tags = Column(String(255), nullable=True, default="")

    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    notes = relationship("CustomerNote", back_populates="customer", cascade="all, delete-orphan")
    tasks = relationship("FollowUpTask", back_populates="customer", cascade="all, delete-orphan")

    @property
    def full_name(self) -> str:
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.email


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    woo_id = Column(Integer, unique=True, nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True, index=True)
    guest_email = Column(String(255), nullable=True)
    guest_name = Column(String(200), nullable=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(String(50), default="processing", index=True)  # completed, processing, pending, on-hold, cancelled, refunded, failed
    total = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)
    tax_total = Column(Float, default=0.0)
    shipping_total = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    date_created = Column(DateTime, default=datetime.utcnow, index=True)
    date_completed = Column(DateTime, nullable=True)
    payment_method = Column(String(100), default="Online / Card")
    is_demo = Column(Boolean, default=True)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    woo_item_id = Column(Integer, nullable=True)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(Float, default=0.0)
    total_price = Column(Float, default=0.0)
    sku = Column(String(100), nullable=True)

    order = relationship("Order", back_populates="items")


class CustomerNote(Base):
    __tablename__ = "customer_notes"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_by = Column(String(100), default="CRM Agent")
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="notes")


class FollowUpTask(Base):
    __tablename__ = "follow_up_tasks"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high
    due_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending")  # pending, completed, cancelled
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), default="CRM Agent")

    customer = relationship("Customer", back_populates="tasks")


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="running")  # success, failed, running
    is_demo_sync = Column(Boolean, default=True)
    customers_synced = Column(Integer, default=0)
    orders_synced = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
