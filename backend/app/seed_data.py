from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Customer, Order, OrderItem, CustomerNote, FollowUpTask, SyncLog

def seed_database(db: Session, force: bool = False):
    existing_customers = db.query(Customer).count()
    if existing_customers > 0 and not force:
        return

    if force:
        db.query(OrderItem).delete()
        db.query(Order).delete()
        db.query(FollowUpTask).delete()
        db.query(CustomerNote).delete()
        db.query(Customer).delete()
        db.query(SyncLog).delete()
        db.commit()

    now = datetime.utcnow()
    
    # 1. Seed realistic customers
    # We create a diverse pool of 12 customers:
    # - High-value active (spent > 25k, recent orders)
    # - High-value inactive (spent > 5k, no orders in > 60 days)
    # - Moderate returning
    # - New single order
    # - Zero orders (leads)
    
    customers_data = [
        {
            "woo_id": 101,
            "first_name": "Aarav",
            "last_name": "Sharma",
            "email": "aarav.sharma@example.com",
            "phone": "+91 98201 12345",
            "address_line1": "Flat 402, Sea Breeze Apts, Bandra West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "IN",
            "postcode": "400050",
            "custom_tags": "VIP, Tech Enthusiast",
            "is_demo": True,
            "created_at": now - timedelta(days=200)
        },
        {
            "woo_id": 102,
            "first_name": "Priya",
            "last_name": "Patel",
            "email": "priya.patel@example.com",
            "phone": "+91 98795 23456",
            "address_line1": "12 Shanti Niketan, Navrangpura",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "country": "IN",
            "postcode": "380009",
            "custom_tags": "High Value, Needs Engagement",
            "is_demo": True,
            "created_at": now - timedelta(days=150)
        },
        {
            "woo_id": 103,
            "first_name": "Rohan",
            "last_name": "Mehta",
            "email": "rohan.mehta@example.com",
            "phone": "+91 99102 34567",
            "address_line1": "C-14 Hauz Khas Enclave",
            "city": "New Delhi",
            "state": "Delhi",
            "country": "IN",
            "postcode": "110016",
            "custom_tags": "Corporate, Premium",
            "is_demo": True,
            "created_at": now - timedelta(days=180)
        },
        {
            "woo_id": 104,
            "first_name": "Ananya",
            "last_name": "Iyer",
            "email": "ananya.iyer@example.com",
            "phone": "+91 94441 45678",
            "address_line1": "45 Besant Avenue, Adyar",
            "city": "Chennai",
            "state": "Tamil Nadu",
            "country": "IN",
            "postcode": "600020",
            "custom_tags": "Returning, Lifestyle",
            "is_demo": True,
            "created_at": now - timedelta(days=90)
        },
        {
            "woo_id": 105,
            "first_name": "Vikram",
            "last_name": "Desai",
            "email": "vikram.desai@example.com",
            "phone": "+91 98220 56789",
            "address_line1": "88 Koregaon Park Road",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "IN",
            "postcode": "411001",
            "custom_tags": "High Value, At Risk",
            "is_demo": True,
            "created_at": now - timedelta(days=220)
        },
        {
            "woo_id": 106,
            "first_name": "Sneha",
            "last_name": "Reddy",
            "email": "sneha.reddy@example.com",
            "phone": "+91 98490 67890",
            "address_line1": "Plot 21, Road No. 10, Jubilee Hills",
            "city": "Hyderabad",
            "state": "Telangana",
            "country": "IN",
            "postcode": "500033",
            "custom_tags": "Fashion, High AOV",
            "is_demo": True,
            "created_at": now - timedelta(days=110)
        },
        {
            "woo_id": 107,
            "first_name": "Kabir",
            "last_name": "Sen",
            "email": "kabir.sen@example.com",
            "phone": "+91 98300 78901",
            "address_line1": "7/2 Ballygunge Circular Rd",
            "city": "Kolkata",
            "state": "West Bengal",
            "country": "IN",
            "postcode": "700019",
            "custom_tags": "New Customer",
            "is_demo": True,
            "created_at": now - timedelta(days=15)
        },
        {
            "woo_id": 108,
            "first_name": "Divya",
            "last_name": "Nair",
            "email": "divya.nair@example.com",
            "phone": "+91 98470 89012",
            "address_line1": "19 Marine Drive, Ernakulam",
            "city": "Kochi",
            "state": "Kerala",
            "country": "IN",
            "postcode": "682011",
            "custom_tags": "New Customer, Organic",
            "is_demo": True,
            "created_at": now - timedelta(days=8)
        },
        {
            "woo_id": 109,
            "first_name": "Rahul",
            "last_name": "Verma",
            "email": "rahul.verma@example.com",
            "phone": "+91 97110 90123",
            "address_line1": "302 Sector 14",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "IN",
            "postcode": "122001",
            "custom_tags": "Returning, Audio",
            "is_demo": True,
            "created_at": now - timedelta(days=70)
        },
        {
            "woo_id": 110,
            "first_name": "Meera",
            "last_name": "Bansal",
            "email": "meera.bansal@example.com",
            "phone": "+91 98140 01234",
            "address_line1": "Villa 18, Sector 9",
            "city": "Chandigarh",
            "state": "Punjab",
            "country": "IN",
            "postcode": "160009",
            "custom_tags": "Potential VIP",
            "is_demo": True,
            "created_at": now - timedelta(days=60)
        },
        {
            "woo_id": 111,
            "first_name": "Karan",
            "last_name": "Malhotra",
            "email": "karan.malhotra@example.com",
            "phone": "+91 98210 11223",
            "address_line1": "504 DLF Cyber City",
            "city": "Gurugram",
            "state": "Haryana",
            "country": "IN",
            "postcode": "122002",
            "custom_tags": "Prospect, Signed Up",
            "is_demo": True,
            "created_at": now - timedelta(days=25)
        },
        {
            "woo_id": 112,
            "first_name": "Ishaan",
            "last_name": "Gupta",
            "email": "ishaan.gupta@example.com",
            "phone": "+91 98110 22334",
            "address_line1": "Flat 12B, Green Glen Layout, Bellandur",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "IN",
            "postcode": "560103",
            "custom_tags": "Lead, Cart Abandoner",
            "is_demo": True,
            "created_at": now - timedelta(days=40)
        },
        {
            "woo_id": 113,
            "first_name": "Tanya",
            "last_name": "Kapoor",
            "email": "tanya.kapoor@example.com",
            "phone": "+91 98118 77665",
            "address_line1": "Penthouse 9, Oberoi Sky Heights, Andheri West",
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "IN",
            "postcode": "400053",
            "custom_tags": "VIP, Critical Churn Risk",
            "is_demo": True,
            "created_at": now - timedelta(days=260)
        },
        {
            "woo_id": 114,
            "first_name": "Aditya",
            "last_name": "Joshi",
            "email": "aditya.joshi@example.com",
            "phone": "+91 99203 44556",
            "address_line1": "Flat 301, Silver Oak, Viman Nagar",
            "city": "Pune",
            "state": "Maharashtra",
            "country": "IN",
            "postcode": "411014",
            "custom_tags": "Payment Dropout, Attention Needed",
            "is_demo": True,
            "created_at": now - timedelta(days=10)
        },
        {
            "woo_id": 115,
            "first_name": "Neha",
            "last_name": "Singhania",
            "email": "neha.singhania@example.com",
            "phone": "+91 98765 43210",
            "address_line1": "8/4 Alipore Road",
            "city": "Kolkata",
            "state": "West Bengal",
            "country": "IN",
            "postcode": "700027",
            "custom_tags": "Payment On-Hold, Verification Pending",
            "is_demo": True,
            "created_at": now - timedelta(days=20)
        },
        {
            "woo_id": 116,
            "first_name": "Kavita",
            "last_name": "Roy",
            "email": "kavita.roy@example.com",
            "phone": "+91 94330 12389",
            "address_line1": "52 Indiranagar 100ft Road",
            "city": "Bengaluru",
            "state": "Karnataka",
            "country": "IN",
            "postcode": "560038",
            "custom_tags": "Refund Disputed, High Returns",
            "is_demo": True,
            "created_at": now - timedelta(days=130)
        }
    ]

    customer_objs = []
    for c_data in customers_data:
        cust = Customer(**c_data)
        db.add(cust)
        customer_objs.append(cust)
    db.commit()

    # Re-fetch customer objects with IDs
    c_map = {c.email: c for c in db.query(Customer).all()}

    # 2. Seed realistic orders and line items
    # Note:
    # - Aarav Sharma (Active VIP): 4 orders (total ~₹38,000, latest 4 days ago)
    # - Priya Patel (Inactive High-Value): 3 orders (total ~₹16,500, latest 72 days ago) -> Matches prompt: inactive > 60d, spent > ₹5,000!
    # - Rohan Mehta (Inactive High-Value): 2 orders (total ~₹12,400, latest 85 days ago) -> Matches prompt: inactive > 60d, spent > ₹5,000!
    # - Vikram Desai (Inactive High-Value): 3 orders (total ~₹21,000, latest 95 days ago) -> Matches prompt: inactive > 60d, spent > ₹5,000!
    # - Ananya Iyer (Returning): 2 orders (total ~₹7,500, latest 18 days ago)
    # - Sneha Reddy (High AOV): 2 orders (total ~₹19,000, latest 12 days ago)
    # - Kabir Sen (New): 1 order (total ~₹4,200, latest 6 days ago)
    # - Divya Nair (New): 1 order (total ~₹2,800, latest 3 days ago)
    # - Rahul Verma (Returning): 2 orders (total ~₹8,500, latest 28 days ago)
    # - Meera Bansal (Single): 1 order (total ~₹3,500, latest 45 days ago)
    # - Karan Malhotra (Lead): 0 orders
    # - Ishaan Gupta (Lead): 0 orders
    # - Guest orders (handled gracefully)
    
    orders_data = [
        # Aarav Sharma (101)
        {
            "customer": c_map["aarav.sharma@example.com"],
            "order_number": "WC-1001",
            "woo_id": 5001,
            "status": "completed",
            "total": 14999.0,
            "subtotal": 12711.0,
            "tax_total": 2288.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=120),
            "payment_method": "Razorpay / UPI",
            "items": [
                {"product_name": "Bose QuietComfort 45 Headphones", "quantity": 1, "unit_price": 14999.0, "total_price": 14999.0, "sku": "BOSE-QC45"}
            ]
        },
        {
            "customer": c_map["aarav.sharma@example.com"],
            "order_number": "WC-1002",
            "woo_id": 5002,
            "status": "completed",
            "total": 8500.0,
            "subtotal": 7203.0,
            "tax_total": 1297.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=65),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Keychron K2 Mechanical Keyboard", "quantity": 1, "unit_price": 7500.0, "total_price": 7500.0, "sku": "KEY-K2"},
                {"product_name": "Premium Felt Desk Mat (Large)", "quantity": 1, "unit_price": 1000.0, "total_price": 1000.0, "sku": "MAT-FLT-L"}
            ]
        },
        {
            "customer": c_map["aarav.sharma@example.com"],
            "order_number": "WC-1003",
            "woo_id": 5003,
            "status": "completed",
            "total": 11200.0,
            "subtotal": 9491.0,
            "tax_total": 1709.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=22),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Logitech MX Master 3S Mouse", "quantity": 1, "unit_price": 8900.0, "total_price": 8900.0, "sku": "LOGI-MX3S"},
                {"product_name": "Ergonomic Bamboo Laptop Stand", "quantity": 1, "unit_price": 2300.0, "total_price": 2300.0, "sku": "STND-BMB-01"}
            ]
        },
        {
            "customer": c_map["aarav.sharma@example.com"],
            "order_number": "WC-1004",
            "woo_id": 5004,
            "status": "processing",
            "total": 3499.0,
            "subtotal": 2965.0,
            "tax_total": 534.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=4),
            "payment_method": "Razorpay / UPI",
            "items": [
                {"product_name": "Anker 65W GaN Fast Charger", "quantity": 1, "unit_price": 3499.0, "total_price": 3499.0, "sku": "ANK-65W"}
            ]
        },

        # Priya Patel (102) - Inactive High Value (Last purchase 72 days ago, Total: ₹16,500)
        {
            "customer": c_map["priya.patel@example.com"],
            "order_number": "WC-1005",
            "woo_id": 5005,
            "status": "completed",
            "total": 6800.0,
            "subtotal": 5762.0,
            "tax_total": 1038.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=140),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Nordic Ceramic Coffee Carafe Set", "quantity": 1, "unit_price": 4200.0, "total_price": 4200.0, "sku": "CAR-SET-01"},
                {"product_name": "Organic Arabica Roast Beans (1kg)", "quantity": 2, "unit_price": 1300.0, "total_price": 2600.0, "sku": "COF-ARB-1KG"}
            ]
        },
        {
            "customer": c_map["priya.patel@example.com"],
            "order_number": "WC-1006",
            "woo_id": 5006,
            "status": "completed",
            "total": 5200.0,
            "subtotal": 4406.0,
            "tax_total": 794.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=105),
            "payment_method": "Razorpay / UPI",
            "items": [
                {"product_name": "Cold Brew Maker 1.5L", "quantity": 1, "unit_price": 2600.0, "total_price": 2600.0, "sku": "CBRW-15L"},
                {"product_name": "Organic Arabica Roast Beans (1kg)", "quantity": 2, "unit_price": 1300.0, "total_price": 2600.0, "sku": "COF-ARB-1KG"}
            ]
        },
        {
            "customer": c_map["priya.patel@example.com"],
            "order_number": "WC-1007",
            "woo_id": 5007,
            "status": "completed",
            "total": 4500.0,
            "subtotal": 3813.0,
            "tax_total": 687.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=72),
            "payment_method": "Net Banking",
            "items": [
                {"product_name": "Manual Conical Burr Coffee Grinder", "quantity": 1, "unit_price": 4500.0, "total_price": 4500.0, "sku": "GRND-BURR-01"}
            ]
        },

        # Rohan Mehta (103) - Inactive High Value (Last purchase 85 days ago, Total: ₹12,400)
        {
            "customer": c_map["rohan.mehta@example.com"],
            "order_number": "WC-1008",
            "woo_id": 5008,
            "status": "completed",
            "total": 8900.0,
            "subtotal": 7542.0,
            "tax_total": 1358.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=160),
            "payment_method": "Corporate Card",
            "items": [
                {"product_name": "Dual Monitor Arm (Heavy Duty)", "quantity": 1, "unit_price": 6900.0, "total_price": 6900.0, "sku": "ARM-DUAL-01"},
                {"product_name": "Cable Management Spine", "quantity": 1, "unit_price": 2000.0, "total_price": 2000.0, "sku": "CBL-SPINE-01"}
            ]
        },
        {
            "customer": c_map["rohan.mehta@example.com"],
            "order_number": "WC-1009",
            "woo_id": 5009,
            "status": "completed",
            "total": 3500.0,
            "subtotal": 2966.0,
            "tax_total": 534.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=85),
            "payment_method": "Corporate Card",
            "items": [
                {"product_name": "ScreenBar LED Monitor Light", "quantity": 1, "unit_price": 3500.0, "total_price": 3500.0, "sku": "BAR-SCRN-01"}
            ]
        },

        # Ananya Iyer (104) - Returning
        {
            "customer": c_map["ananya.iyer@example.com"],
            "order_number": "WC-1010",
            "woo_id": 5010,
            "status": "completed",
            "total": 4200.0,
            "subtotal": 3559.0,
            "tax_total": 641.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=75),
            "payment_method": "Razorpay / UPI",
            "items": [
                {"product_name": "Aroma Essential Oil Diffuser (Ultrasonic)", "quantity": 1, "unit_price": 2800.0, "total_price": 2800.0, "sku": "DIFF-ULTRA-01"},
                {"product_name": "Pure Lavender & Bergamot Oil Pack", "quantity": 1, "unit_price": 1400.0, "total_price": 1400.0, "sku": "OIL-LAV-01"}
            ]
        },
        {
            "customer": c_map["ananya.iyer@example.com"],
            "order_number": "WC-1011",
            "woo_id": 5011,
            "status": "completed",
            "total": 3300.0,
            "subtotal": 2796.0,
            "tax_total": 504.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=18),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Himalayan Pink Salt Aroma Lamp", "quantity": 1, "unit_price": 3300.0, "total_price": 3300.0, "sku": "LAMP-SALT-01"}
            ]
        },

        # Vikram Desai (105) - Inactive High Value (Last purchase 95 days ago, Total: ₹21,000)
        {
            "customer": c_map["vikram.desai@example.com"],
            "order_number": "WC-1012",
            "woo_id": 5012,
            "status": "completed",
            "total": 12500.0,
            "subtotal": 10593.0,
            "tax_total": 1907.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=190),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Standing Desk Converter (Gas Spring)", "quantity": 1, "unit_price": 12500.0, "total_price": 12500.0, "sku": "DESK-CNV-01"}
            ]
        },
        {
            "customer": c_map["vikram.desai@example.com"],
            "order_number": "WC-1013",
            "woo_id": 5013,
            "status": "completed",
            "total": 8500.0,
            "subtotal": 7203.0,
            "tax_total": 1297.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=95),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Active Anti-Fatigue Balance Mat", "quantity": 1, "unit_price": 4500.0, "total_price": 4500.0, "sku": "MAT-FATG-01"},
                {"product_name": "Ergonomic Memory Foam Lumbar Support", "quantity": 1, "unit_price": 4000.0, "total_price": 4000.0, "sku": "FOAM-LUMB-01"}
            ]
        },

        # Sneha Reddy (106) - High AOV & Recent
        {
            "customer": c_map["sneha.reddy@example.com"],
            "order_number": "WC-1014",
            "woo_id": 5014,
            "status": "completed",
            "total": 11500.0,
            "subtotal": 9745.0,
            "tax_total": 1755.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=50),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Pure Cashmere Wool Travel Wrap", "quantity": 1, "unit_price": 11500.0, "total_price": 11500.0, "sku": "WRAP-CASH-01"}
            ]
        },
        {
            "customer": c_map["sneha.reddy@example.com"],
            "order_number": "WC-1015",
            "woo_id": 5015,
            "status": "completed",
            "total": 7800.0,
            "subtotal": 6610.0,
            "tax_total": 1190.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=12),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Handmade Full-Grain Leather Tote", "quantity": 1, "unit_price": 7800.0, "total_price": 7800.0, "sku": "TOTE-LTH-01"}
            ]
        },

        # Kabir Sen (107) - New Customer
        {
            "customer": c_map["kabir.sen@example.com"],
            "order_number": "WC-1016",
            "woo_id": 5016,
            "status": "completed",
            "total": 4200.0,
            "subtotal": 3559.0,
            "tax_total": 641.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=6),
            "payment_method": "UPI",
            "items": [
                {"product_name": "Smart Hydration Water Bottle (Insulated)", "quantity": 1, "unit_price": 4200.0, "total_price": 4200.0, "sku": "BTL-SMRT-01"}
            ]
        },

        # Divya Nair (108) - New Customer
        {
            "customer": c_map["divya.nair@example.com"],
            "order_number": "WC-1017",
            "woo_id": 5017,
            "status": "processing",
            "total": 2800.0,
            "subtotal": 2372.0,
            "tax_total": 428.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=3),
            "payment_method": "UPI",
            "items": [
                {"product_name": "Organic Matcha Ceremonial Grade 100g", "quantity": 1, "unit_price": 2800.0, "total_price": 2800.0, "sku": "MAT-ORG-100G"}
            ]
        },

        # Rahul Verma (109) - Returning
        {
            "customer": c_map["rahul.verma@example.com"],
            "order_number": "WC-1018",
            "woo_id": 5018,
            "status": "completed",
            "total": 4600.0,
            "subtotal": 3898.0,
            "tax_total": 702.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=60),
            "payment_method": "UPI",
            "items": [
                {"product_name": "Bluetooth Audio DAC Receiver", "quantity": 1, "unit_price": 4600.0, "total_price": 4600.0, "sku": "DAC-BT-01"}
            ]
        },
        {
            "customer": c_map["rahul.verma@example.com"],
            "order_number": "WC-1019",
            "woo_id": 5019,
            "status": "completed",
            "total": 3900.0,
            "subtotal": 3305.0,
            "tax_total": 595.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=28),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "In-Ear Balanced Armature Monitors", "quantity": 1, "unit_price": 3900.0, "total_price": 3900.0, "sku": "IEM-ARM-01"}
            ]
        },

        # Meera Bansal (110) - Single purchase
        {
            "customer": c_map["meera.bansal@example.com"],
            "order_number": "WC-1020",
            "woo_id": 5020,
            "status": "completed",
            "total": 3500.0,
            "subtotal": 2966.0,
            "tax_total": 534.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=45),
            "payment_method": "UPI",
            "items": [
                {"product_name": "Stainless Steel Bento Box Set", "quantity": 1, "unit_price": 3500.0, "total_price": 3500.0, "sku": "BNT-BOX-02"}
            ]
        },

        # Cancelled & Failed orders (for testing revenue calculation exclusion!)
        {
            "customer": c_map["rahul.verma@example.com"],
            "order_number": "WC-1021",
            "woo_id": 5021,
            "status": "cancelled",
            "total": 8900.0,
            "subtotal": 7542.0,
            "tax_total": 1358.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=10),
            "payment_method": "UPI",
            "items": [
                {"product_name": "Bose QuietComfort 45 Headphones", "quantity": 1, "unit_price": 8900.0, "total_price": 8900.0, "sku": "BOSE-QC45"}
            ]
        },
        {
            "customer": c_map["priya.patel@example.com"],
            "order_number": "WC-1022",
            "woo_id": 5022,
            "status": "failed",
            "total": 5200.0,
            "subtotal": 4406.0,
            "tax_total": 794.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=5),
            "payment_method": "Net Banking",
            "items": [
                {"product_name": "Manual Conical Burr Coffee Grinder", "quantity": 1, "unit_price": 5200.0, "total_price": 5200.0, "sku": "GRND-BURR-01"}
            ]
        },

        # Guest orders (customer_id=None, missing customer record)
        {
            "customer": None,
            "guest_name": "Amitabh Roy (Guest)",
            "guest_email": "amitabh.roy.guest@example.com",
            "order_number": "WC-1023",
            "woo_id": 5023,
            "status": "completed",
            "total": 6400.0,
            "subtotal": 5423.0,
            "tax_total": 977.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=2),
            "payment_method": "Credit Card",
            "items": [
                {"product_name": "Premium Merino Wool Hoodie", "quantity": 1, "unit_price": 6400.0, "total_price": 6400.0, "sku": "HOD-MERINO-01"}
            ]
        },

        # Tanya Kapoor (113) - Critical VIP Churn Case: Spent ₹64,500, but inactive for >130 days!
        {
            "customer": c_map["tanya.kapoor@example.com"],
            "order_number": "WC-1024",
            "woo_id": 5024,
            "status": "completed",
            "total": 24999.0,
            "subtotal": 21185.0,
            "tax_total": 3814.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=240),
            "payment_method": "Credit Card (HDFC)",
            "items": [
                {"product_name": "UltraWide Curved 34-inch Monitor", "quantity": 1, "unit_price": 24999.0, "total_price": 24999.0, "sku": "DISP-UW34"}
            ]
        },
        {
            "customer": c_map["tanya.kapoor@example.com"],
            "order_number": "WC-1025",
            "woo_id": 5025,
            "status": "completed",
            "total": 18500.0,
            "subtotal": 15678.0,
            "tax_total": 2822.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=190),
            "payment_method": "Credit Card (HDFC)",
            "items": [
                {"product_name": "Mechanical Studio Keyboard - Custom Brass", "quantity": 1, "unit_price": 18500.0, "total_price": 18500.0, "sku": "KB-BRASS-PRO"}
            ]
        },
        {
            "customer": c_map["tanya.kapoor@example.com"],
            "order_number": "WC-1026",
            "woo_id": 5026,
            "status": "completed",
            "total": 21000.0,
            "subtotal": 17796.0,
            "tax_total": 3204.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=135),
            "payment_method": "Razorpay / UPI",
            "items": [
                {"product_name": "Solid Walnut Standing Desk Top", "quantity": 1, "unit_price": 21000.0, "total_price": 21000.0, "sku": "DESK-WALNUT-60"}
            ]
        },

        # Aditya Joshi (114) - Payment Failed Dropout (Immediate recovery candidate)
        {
            "customer": c_map["aditya.joshi@example.com"],
            "order_number": "WC-1027",
            "woo_id": 5027,
            "status": "failed",
            "total": 18500.0,
            "subtotal": 15678.0,
            "tax_total": 2822.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=2),
            "payment_method": "Card Declined (3DS Timeout / Gateway Error)",
            "items": [
                {"product_name": "De'Longhi Dedica Espresso Machine", "quantity": 1, "unit_price": 18500.0, "total_price": 18500.0, "sku": "ESP-DEDICA-01"}
            ]
        },

        # Neha Singhania (115) - Stalled On-Hold Payment (Awaiting manual verification >4 days)
        {
            "customer": c_map["neha.singhania@example.com"],
            "order_number": "WC-1028",
            "woo_id": 5028,
            "status": "on-hold",
            "total": 22900.0,
            "subtotal": 19406.0,
            "tax_total": 3494.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=4),
            "payment_method": "Direct Bank Transfer (Awaiting UTR Reference)",
            "items": [
                {"product_name": "Ergonomic High-Back Executive Chair", "quantity": 1, "unit_price": 22900.0, "total_price": 22900.0, "sku": "CHR-ERGO-HIGH"}
            ]
        },

        # Kavita Roy (116) - Disputed Returns & Cancelled Order
        {
            "customer": c_map["kavita.roy@example.com"],
            "order_number": "WC-1029",
            "woo_id": 5029,
            "status": "completed",
            "total": 4200.0,
            "subtotal": 3559.0,
            "tax_total": 641.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=125),
            "payment_method": "UPI",
            "items": [
                {"product_name": "Acoustic Desktop Isolation Pads (Pair)", "quantity": 1, "unit_price": 4200.0, "total_price": 4200.0, "sku": "PAD-ACOU-PR"}
            ]
        },
        {
            "customer": c_map["kavita.roy@example.com"],
            "order_number": "WC-1030",
            "woo_id": 5030,
            "status": "refunded",
            "total": 8900.0,
            "subtotal": 7542.0,
            "tax_total": 1358.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=45),
            "payment_method": "Razorpay / Card",
            "items": [
                {"product_name": "Studio Reference Headphones (Mic Defect Reported)", "quantity": 1, "unit_price": 8900.0, "total_price": 8900.0, "sku": "AUD-REF-80"}
            ]
        },
        {
            "customer": c_map["kavita.roy@example.com"],
            "order_number": "WC-1031",
            "woo_id": 5031,
            "status": "cancelled",
            "total": 3500.0,
            "subtotal": 2966.0,
            "tax_total": 534.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(days=15),
            "payment_method": "Cash on Delivery",
            "items": [
                {"product_name": "Braided Heavy-Duty Audio Cable Set", "quantity": 1, "unit_price": 3500.0, "total_price": 3500.0, "sku": "CBL-BRD-SET"}
            ]
        },

        # Kabir Sen (107) - Pending Payment Order (36 hours overdue UPI)
        {
            "customer": c_map["kabir.sen@example.com"],
            "order_number": "WC-1032",
            "woo_id": 5032,
            "status": "pending",
            "total": 4999.0,
            "subtotal": 4236.0,
            "tax_total": 763.0,
            "shipping_total": 0.0,
            "date_created": now - timedelta(hours=36),
            "payment_method": "UPI QR Code (Payment Pending)",
            "items": [
                {"product_name": "Anker 100W GaN Fast Charger", "quantity": 1, "unit_price": 4999.0, "total_price": 4999.0, "sku": "CHG-ANK-100W"}
            ]
        }
    ]

    for ord_info in orders_data:
        cust = ord_info["customer"]
        order = Order(
            woo_id=ord_info["woo_id"],
            customer_id=cust.id if cust else None,
            guest_name=ord_info.get("guest_name"),
            guest_email=ord_info.get("guest_email"),
            order_number=ord_info["order_number"],
            status=ord_info["status"],
            total=ord_info["total"],
            subtotal=ord_info["subtotal"],
            tax_total=ord_info["tax_total"],
            shipping_total=ord_info["shipping_total"],
            currency="INR",
            date_created=ord_info["date_created"],
            date_completed=ord_info["date_created"] + timedelta(hours=2) if ord_info["status"] == "completed" else None,
            payment_method=ord_info["payment_method"],
            is_demo=True
        )
        db.add(order)
        db.flush()

        for item_data in ord_info["items"]:
            item = OrderItem(
                order_id=order.id,
                woo_item_id=ord_info["woo_id"] * 10 + 1,
                product_name=item_data["product_name"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                total_price=item_data["total_price"],
                sku=item_data.get("sku")
            )
            db.add(item)
    
    db.commit()

    # 3. Seed notes
    notes_data = [
        {
            "customer": c_map["aarav.sharma@example.com"],
            "content": "Requested expedited shipping for the keyboard. Offered 10% coupon on next peripheral purchase.",
            "created_by": "Support Lead",
            "created_at": now - timedelta(days=60)
        },
        {
            "customer": c_map["aarav.sharma@example.com"],
            "content": "Enquired about custom keycaps availability. Advised to subscribe to mechanical keyboards newsletter.",
            "created_by": "CRM Agent",
            "created_at": now - timedelta(days=15)
        },
        {
            "customer": c_map["priya.patel@example.com"],
            "content": "Customer mentioned she runs a small boutique studio and prefers dark roasts. High potential for wholesale volume.",
            "created_by": "Sales Rep",
            "created_at": now - timedelta(days=100)
        },
        {
            "customer": c_map["rohan.mehta@example.com"],
            "content": "Company reimburses home workstation gear up to ₹25k annually. Good candidate for Q4 corporate refresh pitch.",
            "created_by": "Enterprise Team",
            "created_at": now - timedelta(days=80)
        },
        {
            "customer": c_map["sneha.reddy@example.com"],
            "content": "Very satisfied with cashmere wrap quality. Left a 5-star review on store.",
            "created_by": "Customer Success",
            "created_at": now - timedelta(days=40)
        },
        {
            "customer": c_map["tanya.kapoor@example.com"],
            "content": "VIP Account Alert: Historical spend of ₹64,500 across 4 premium orders. Inactive for over 130 days. High churn danger. Needs proactive executive re-engagement.",
            "created_by": "CRM Intelligence",
            "created_at": now - timedelta(days=10)
        },
        {
            "customer": c_map["aditya.joshi@example.com"],
            "content": "Checkout Abandonment / Payment Failure: Order WC-1027 failed at HDFC 3DS payment gateway. Cart value is ₹18,500. Initiated payment recovery email.",
            "created_by": "System Event",
            "created_at": now - timedelta(days=2)
        },
        {
            "customer": c_map["neha.singhania@example.com"],
            "content": "Payment On-Hold: High-value order WC-1028 (₹22,900) placed via Direct Bank Transfer. 4 days elapsed without UTR confirmation from accounts.",
            "created_by": "Finance Ops",
            "created_at": now - timedelta(days=3)
        },
        {
            "customer": c_map["kavita.roy@example.com"],
            "content": "Refund processed for WC-1030 (₹8,900) due to microphone hardware defect reported in Studio Headphones. Order WC-1031 subsequently cancelled.",
            "created_by": "Support Lead",
            "created_at": now - timedelta(days=14)
        }
    ]

    for n_data in notes_data:
        note = CustomerNote(
            customer_id=n_data["customer"].id,
            content=n_data["content"],
            created_by=n_data["created_by"],
            created_at=n_data["created_at"]
        )
        db.add(note)

    # 4. Seed follow-up tasks
    tasks_data = [
        {
            "customer": c_map["aarav.sharma@example.com"],
            "title": "Send VIP preview link for mechanical desk series",
            "description": "Send personalized email with early bird code for upcoming keycap drop.",
            "priority": "medium",
            "due_date": now + timedelta(days=2),
            "status": "pending",
            "created_by": "CRM Agent",
            "created_at": now - timedelta(days=3)
        },
        {
            "customer": c_map["priya.patel@example.com"],
            "title": "Re-engage: Share special 15% discount for organic coffee beans",
            "description": "Customer has been inactive for over 60 days. Follow up with artisanal roast collection.",
            "priority": "high",
            "due_date": now + timedelta(days=1),
            "status": "pending",
            "created_by": "AI Copilot",
            "created_at": now - timedelta(days=2)
        },
        {
            "customer": c_map["karan.malhotra@example.com"],
            "title": "Welcome call & onboarding assistance",
            "description": "User created an account 25 days ago but hasn't placed first order. Send curated starter guide.",
            "priority": "low",
            "due_date": now + timedelta(days=4),
            "status": "pending",
            "created_by": "Sales Rep",
            "created_at": now - timedelta(days=5)
        },
        {
            "customer": c_map["sneha.reddy@example.com"],
            "title": "Follow up after leather tote delivery",
            "description": "Ensure packaging was intact and offer leather conditioner care kit.",
            "priority": "medium",
            "due_date": now - timedelta(days=5),
            "status": "completed",
            "completed_at": now - timedelta(days=4),
            "created_by": "Support Lead",
            "created_at": now - timedelta(days=10)
        },
        {
            "customer": c_map["aditya.joshi@example.com"],
            "title": "Recover failed payment: Aditya Joshi (₹18,500 Espresso Machine)",
            "description": "HDFC gateway failed. Send recovery WhatsApp/email with direct UPI payment link to rescue transaction.",
            "priority": "urgent",
            "due_date": now + timedelta(hours=6),
            "status": "pending",
            "created_by": "Payment Recovery Bot",
            "created_at": now - timedelta(days=1)
        },
        {
            "customer": c_map["neha.singhania@example.com"],
            "title": "Verify NEFT Bank Transfer UTR for WC-1028 (₹22,900)",
            "description": "Call customer or check corporate bank statement for incoming NEFT credit before order cancellation.",
            "priority": "high",
            "due_date": now + timedelta(days=1),
            "status": "pending",
            "created_by": "Finance Ops",
            "created_at": now - timedelta(days=2)
        },
        {
            "customer": c_map["tanya.kapoor@example.com"],
            "title": "VIP Win-back campaign: Tanya Kapoor (₹64,500 spend, inactive 130d)",
            "description": "Generate custom AI win-back offer with concierge perk and 20% discount on standing desk accessories.",
            "priority": "high",
            "due_date": now + timedelta(days=2),
            "status": "pending",
            "created_by": "AI Copilot",
            "created_at": now - timedelta(days=3)
        },
        {
            "customer": c_map["kavita.roy@example.com"],
            "title": "Goodwill outreach & store credit voucher for defective headphones",
            "description": "Check in following microphone defect refund (WC-1030). Offer ₹1,000 goodwill credit to rebuild trust.",
            "priority": "medium",
            "due_date": now + timedelta(days=3),
            "status": "pending",
            "created_by": "Customer Success",
            "created_at": now - timedelta(days=5)
        }
    ]

    for t_data in tasks_data:
        task = FollowUpTask(
            customer_id=t_data["customer"].id,
            title=t_data["title"],
            description=t_data["description"],
            priority=t_data["priority"],
            due_date=t_data["due_date"],
            status=t_data["status"],
            created_by=t_data["created_by"],
            created_at=t_data["created_at"],
            completed_at=t_data.get("completed_at")
        )
        db.add(task)

    # 5. Seed initial SyncLog
    sync_log = SyncLog(
        started_at=now - timedelta(hours=1),
        finished_at=now - timedelta(hours=1, seconds=-4),
        status="success",
        is_demo_sync=True,
        customers_synced=16,
        orders_synced=27,
        error_message=None,
        details="Demo store dataset loaded successfully with 16 customers, 27 orders (including edge cases: failed checkout, stalled on-hold payments, refunded orders, and churning VIPs)."
    )
    db.add(sync_log)

    db.commit()
