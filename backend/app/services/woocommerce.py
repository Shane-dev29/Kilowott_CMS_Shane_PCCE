from datetime import datetime
import json
from typing import Dict, Any, Optional, Tuple, List
import httpx
from sqlalchemy.orm import Session
from app.config import settings
from app.models import Customer, Order, OrderItem, SyncLog

class WooCommerceService:
    def __init__(self):
        self.store_url = settings.WOOCOMMERCE_STORE_URL.rstrip("/")
        self.consumer_key = settings.WOOCOMMERCE_CONSUMER_KEY
        self.consumer_secret = settings.WOOCOMMERCE_CONSUMER_SECRET
        self.timeout = settings.WOOCOMMERCE_TIMEOUT

    def is_configured(self) -> bool:
        return bool(self.store_url and self.consumer_key and self.consumer_secret)

    async def test_connection(self) -> Dict[str, Any]:
        """
        Tests the connection to the WooCommerce REST API v3 endpoint.
        Returns honest status and details.
        """
        if not self.is_configured():
            return {
                "success": False,
                "message": "WooCommerce credentials not configured. Please set WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in backend/.env to connect to a live store.",
                "store_url": self.store_url or None,
                "configured": False
            }

        url = f"{self.store_url}/wp-json/wc/v3/system_status"
        try:
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                response = await client.get(
                    url,
                    auth=(self.consumer_key, self.consumer_secret)
                )

                if response.status_code == 200:
                    data = response.json()
                    env = data.get("environment", {})
                    return {
                        "success": True,
                        "message": f"Successfully connected to WooCommerce store! Store Version: {env.get('version', 'N/A')}, WordPress Version: {env.get('wp_version', 'N/A')}",
                        "store_url": self.store_url,
                        "details": {
                            "wc_version": env.get("version"),
                            "wp_version": env.get("wp_version"),
                            "currency": data.get("settings", {}).get("currency", "INR")
                        }
                    }
                else:
                    return {
                        "success": False,
                        "message": f"WooCommerce API returned HTTP status {response.status_code}: {response.text[:200]}",
                        "store_url": self.store_url,
                        "status_code": response.status_code
                    }
        except httpx.RequestError as exc:
            return {
                "success": False,
                "message": f"Connection error reaching WooCommerce store: {str(exc)}",
                "store_url": self.store_url
            }
        except Exception as exc:
            return {
                "success": False,
                "message": f"Unexpected error during connection test: {str(exc)}",
                "store_url": self.store_url
            }

    async def sync_live_store(self, db: Session) -> Tuple[bool, str, int, int]:
        """
        Pulls customers and orders from WooCommerce REST API v3.
        Performs pagination, duplicate-safe upserts, and never overwrites CRM-specific notes or tasks.
        """
        if not self.is_configured():
            return False, "Store not configured. Cannot perform live sync without valid API credentials.", 0, 0

        started_at = datetime.utcnow()
        sync_log = SyncLog(
            started_at=started_at,
            status="running",
            is_demo_sync=False,
            details="Starting live synchronization from WooCommerce..."
        )
        db.add(sync_log)
        db.commit()

        customers_synced = 0
        orders_synced = 0

        try:
            async with httpx.AsyncClient(timeout=self.timeout, verify=False) as client:
                # 1. Fetch Customers
                cust_page = 1
                all_wc_customers = []
                while True:
                    cust_url = f"{self.store_url}/wp-json/wc/v3/customers?per_page=50&page={cust_page}"
                    resp = await client.get(cust_url, auth=(self.consumer_key, self.consumer_secret))
                    if resp.status_code != 200:
                        break
                    batch = resp.json()
                    if not batch or not isinstance(batch, list):
                        break
                    all_wc_customers.extend(batch)
                    if len(batch) < 50:
                        break
                    cust_page += 1

                for wc_c in all_wc_customers:
                    woo_id = wc_c.get("id")
                    email = wc_c.get("email")
                    if not email:
                        continue

                    billing = wc_c.get("billing", {})
                    first_name = wc_c.get("first_name") or billing.get("first_name", "")
                    last_name = wc_c.get("last_name") or billing.get("last_name", "")
                    phone = billing.get("phone", "")
                    city = billing.get("city", "")
                    state = billing.get("state", "")
                    country = billing.get("country", "IN")
                    postcode = billing.get("postcode", "")
                    address_line1 = billing.get("address_1", "")

                    existing_cust = db.query(Customer).filter(
                        (Customer.woo_id == woo_id) | (Customer.email == email)
                    ).first()

                    if existing_cust:
                        existing_cust.woo_id = woo_id
                        existing_cust.first_name = first_name or existing_cust.first_name
                        existing_cust.last_name = last_name or existing_cust.last_name
                        existing_cust.phone = phone or existing_cust.phone
                        existing_cust.city = city or existing_cust.city
                        existing_cust.state = state or existing_cust.state
                        existing_cust.country = country or existing_cust.country
                        existing_cust.postcode = postcode or existing_cust.postcode
                        existing_cust.address_line1 = address_line1 or existing_cust.address_line1
                        existing_cust.is_demo = False
                        existing_cust.updated_at = datetime.utcnow()
                    else:
                        new_cust = Customer(
                            woo_id=woo_id,
                            first_name=first_name,
                            last_name=last_name,
                            email=email,
                            phone=phone,
                            city=city,
                            state=state,
                            country=country,
                            postcode=postcode,
                            address_line1=address_line1,
                            is_demo=False
                        )
                        db.add(new_cust)
                    customers_synced += 1

                db.commit()

                # 2. Fetch Orders
                order_page = 1
                all_wc_orders = []
                while True:
                    order_url = f"{self.store_url}/wp-json/wc/v3/orders?per_page=50&page={order_page}"
                    resp = await client.get(order_url, auth=(self.consumer_key, self.consumer_secret))
                    if resp.status_code != 200:
                        break
                    batch = resp.json()
                    if not batch or not isinstance(batch, list):
                        break
                    all_wc_orders.extend(batch)
                    if len(batch) < 50:
                        break
                    order_page += 1

                for wc_o in all_wc_orders:
                    woo_order_id = wc_o.get("id")
                    order_number = str(wc_o.get("number", woo_order_id))
                    billing = wc_o.get("billing", {})
                    cust_email = billing.get("email")
                    wc_cust_id = wc_o.get("customer_id")

                    customer_rec = None
                    if wc_cust_id and wc_cust_id > 0:
                        customer_rec = db.query(Customer).filter(Customer.woo_id == wc_cust_id).first()
                    if not customer_rec and cust_email:
                        customer_rec = db.query(Customer).filter(Customer.email == cust_email).first()

                    guest_name = f"{billing.get('first_name', '')} {billing.get('last_name', '')}".strip() if not customer_rec else None
                    guest_email = cust_email if not customer_rec else None

                    date_str = wc_o.get("date_created_gmt") or wc_o.get("date_created")
                    date_created = datetime.fromisoformat(date_str) if date_str else datetime.utcnow()

                    existing_order = db.query(Order).filter(
                        (Order.woo_id == woo_order_id) | (Order.order_number == order_number)
                    ).first()

                    if existing_order:
                        existing_order.woo_id = woo_order_id
                        existing_order.customer_id = customer_rec.id if customer_rec else None
                        existing_order.guest_name = guest_name
                        existing_order.guest_email = guest_email
                        existing_order.status = wc_o.get("status", "processing")
                        existing_order.total = float(wc_o.get("total", 0.0))
                        existing_order.subtotal = float(wc_o.get("subtotal", 0.0) or wc_o.get("total", 0.0))
                        existing_order.tax_total = float(wc_o.get("total_tax", 0.0))
                        existing_order.shipping_total = float(wc_o.get("shipping_total", 0.0))
                        existing_order.currency = wc_o.get("currency", "INR")
                        existing_order.payment_method = wc_o.get("payment_method_title", "Online")
                        existing_order.is_demo = False
                        order_obj = existing_order
                    else:
                        order_obj = Order(
                            woo_id=woo_order_id,
                            customer_id=customer_rec.id if customer_rec else None,
                            guest_name=guest_name,
                            guest_email=guest_email,
                            order_number=order_number,
                            status=wc_o.get("status", "processing"),
                            total=float(wc_o.get("total", 0.0)),
                            subtotal=float(wc_o.get("subtotal", 0.0) or wc_o.get("total", 0.0)),
                            tax_total=float(wc_o.get("total_tax", 0.0)),
                            shipping_total=float(wc_o.get("shipping_total", 0.0)),
                            currency=wc_o.get("currency", "INR"),
                            date_created=date_created,
                            payment_method=wc_o.get("payment_method_title", "Online"),
                            is_demo=False
                        )
                        db.add(order_obj)
                        db.flush()

                    # Synchronize items
                    db.query(OrderItem).filter(OrderItem.order_id == order_obj.id).delete()
                    for item in wc_o.get("line_items", []):
                        db.add(OrderItem(
                            order_id=order_obj.id,
                            woo_item_id=item.get("id"),
                            product_name=item.get("name", "Product"),
                            quantity=int(item.get("quantity", 1)),
                            unit_price=float(item.get("price", 0.0)),
                            total_price=float(item.get("total", 0.0)),
                            sku=item.get("sku")
                        ))

                    orders_synced += 1

                db.commit()

            # Record success
            sync_log.status = "success"
            sync_log.finished_at = datetime.utcnow()
            sync_log.customers_synced = customers_synced
            sync_log.orders_synced = orders_synced
            sync_log.details = f"Live sync completed successfully. Synchronized {customers_synced} customers and {orders_synced} orders."
            db.commit()

            return True, f"Successfully synchronized {customers_synced} customers and {orders_synced} orders from WooCommerce store.", customers_synced, orders_synced

        except Exception as e:
            db.rollback()
            sync_log.status = "failed"
            sync_log.finished_at = datetime.utcnow()
            sync_log.error_message = str(e)
            sync_log.details = f"Error occurred during sync: {str(e)}"
            db.commit()
            return False, f"Synchronization failed: {str(e)}", 0, 0

    def sync_demo_mode(self, db: Session) -> Tuple[bool, str, int, int]:
        """
        Re-synchronizes/re-populates the demo dataset and logs the event.
        """
        from app.seed_data import seed_database
        started_at = datetime.utcnow()
        sync_log = SyncLog(
            started_at=started_at,
            status="running",
            is_demo_sync=True,
            details="Refreshing demo dataset..."
        )
        db.add(sync_log)
        db.commit()

        try:
            seed_database(db, force=False)
            cust_count = db.query(Customer).filter(Customer.is_demo == True).count()
            order_count = db.query(Order).filter(Order.is_demo == True).count()

            sync_log.status = "success"
            sync_log.finished_at = datetime.utcnow()
            sync_log.customers_synced = cust_count
            sync_log.orders_synced = order_count
            sync_log.details = f"Demo dataset synchronized. Total demo customers: {cust_count}, orders: {order_count}."
            db.commit()

            return True, f"Demo dataset verified & active. {cust_count} customers and {order_count} orders available.", cust_count, order_count
        except Exception as e:
            db.rollback()
            sync_log.status = "failed"
            sync_log.finished_at = datetime.utcnow()
            sync_log.error_message = str(e)
            db.commit()
            return False, f"Failed to refresh demo dataset: {str(e)}", 0, 0

woocommerce_service = WooCommerceService()
