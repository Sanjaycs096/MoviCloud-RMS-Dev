import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
# Get the directory where this file is located
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from .db import init_db, get_db  # noqa: E402
from .scheduler import start_scheduler, shutdown_scheduler  # noqa: E402

# Import all route modules
from .routes import settings as settings_router  # noqa: E402
from .routes import staff as staff_router  # noqa: E402
from .routes import audit as audit_router  # noqa: E402
from .routes import menu as menu_router  # noqa: E402
from .routes import orders as orders_router  # noqa: E402
from .routes import tables as tables_router  # noqa: E402
from .routes import inventory as inventory_router  # noqa: E402
from .routes import customers as customers_router  # noqa: E402
from .routes import offers as offers_router  # noqa: E402
from .routes import notifications as notifications_router  # noqa: E402
from .routes import billing as billing_router  # noqa: E402
from .routes import analytics as analytics_router  # noqa: E402
from .routes import recipes as recipes_router  # noqa: E402


app = FastAPI(title='RMS Backend (FastAPI)')

# CORS: explicitly list allowed origins for production + allow all for dev
origins = [
    "https://restaurant-management-system-omega-five.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",  # User frontend
    "http://localhost:5175",  # Admin frontend
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

# Also read extra origins from env var (set in Render dashboard for deployed frontends)
_extra_origins = os.getenv("CORS_EXTRA_ORIGINS", "")
if _extra_origins:
    origins += [o.strip() for o in _extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com|https://restaurant-management-system.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.on_event('startup')
async def startup():
    try:
        from .db import init_db
        init_db()
        print("[OK] MongoDB connected successfully")
        # Start the backup scheduler
        await start_scheduler()
    except Exception as e:
        print(f"[WARN] MongoDB connection warning: {e}")
        print("[INFO] API will work in read-only mode or with mock data")


@app.on_event('shutdown')
async def shutdown():
    shutdown_scheduler()


# Settings & Security
app.include_router(settings_router.router, prefix='/api/settings')
app.include_router(staff_router.router, prefix='/api/staff')
app.include_router(audit_router.router, prefix='/api/audit')

# Core Operations
app.include_router(menu_router.router, prefix='/api/menu')
app.include_router(orders_router.router, prefix='/api/orders')
app.include_router(tables_router.router, prefix='/api/tables')
app.include_router(inventory_router.router, prefix='/api/inventory')
app.include_router(recipes_router.router, prefix='/api/recipes')

# Customer Operations
app.include_router(customers_router.router, prefix='/api/customers')

# Marketing & Communications
app.include_router(offers_router.router, prefix='/api/offers')
app.include_router(notifications_router.router, prefix='/api/notifications')

# Billing & Payments
app.include_router(billing_router.router, prefix='/api/billing')

# Analytics
app.include_router(analytics_router.router, prefix='/api/analytics')


# Health check endpoint
@app.get('/api/health')
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "RMS Backend",
        "version": "1.0.0"
    }


# Database Seed Endpoint
@app.post('/api/seed')
async def seed_database(secret: str = ''):
    """Seed the database with sample data. Requires SEED_SECRET env var."""
    from fastapi import HTTPException
    from datetime import datetime
    from passlib.hash import pbkdf2_sha256
    
    expected_secret = os.getenv('SEED_SECRET', 'seed123')
    if secret != expected_secret:
        raise HTTPException(status_code=403, detail='Invalid secret')
    
    try:
        db = get_db()
    except RuntimeError:
        init_db()
        db = get_db()
    
    results = {"staff": 0, "errors": []}
    
    # Sample Staff
    staff_data = [
        {"name": "Admin User", "email": "admin@restaurant.com", "phone": "+91 98765 00001", "role": "admin", "password": "admin123"},
        {"name": "Manager User", "email": "manager@restaurant.com", "phone": "+91 98765 00002", "role": "manager", "password": "manager123"},
        {"name": "Chef User", "email": "chef@restaurant.com", "phone": "+91 98765 00003", "role": "chef", "password": "chef123"},
        {"name": "Waiter User", "email": "waiter@restaurant.com", "phone": "+91 98765 00004", "role": "waiter", "password": "waiter123"},
        {"name": "Cashier User", "email": "cashier@restaurant.com", "phone": "+91 98765 00005", "role": "cashier", "password": "cashier123"},
    ]
    
    try:
        staff_coll = db.get_collection('staff')
        for staff in staff_data:
            try:
                existing = await staff_coll.find_one({"email": staff["email"].lower()})
                if not existing:
                    await staff_coll.insert_one({
                        "name": staff["name"],
                        "email": staff["email"].lower(),
                        "phone": staff["phone"],
                        "role": staff["role"],
                        "password_hash": pbkdf2_sha256.hash(staff["password"]),
                        "active": True,
                        "createdAt": datetime.utcnow(),
                    })
                    results["staff"] += 1
            except Exception as e:
                results["errors"].append(f"{staff['email']}: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return {"success": True, "message": "Database seeded", "created": results}


if __name__ == '__main__':
    import uvicorn
    host = os.getenv('FASTAPI_HOST', '0.0.0.0')
    port = int(os.getenv('FASTAPI_PORT', 8000))
    uvicorn.run('app.main:app', host=host, port=port, reload=True)
