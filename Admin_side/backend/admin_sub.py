"""
admin_sub.py — FastAPI sub-application for Admin routes.

This module is mounted at /api/admin by the unified backend server.
Routes here are prefixed relative to that mount:

    /api/admin/staff/*
    /api/admin/menu/*
    /api/admin/orders/*
    … etc.

Existing route *handlers* in app/routes/*.py are NOT modified.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Load admin .env
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=_env_path)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

from app.db import init_db, get_db  # noqa: E402
from app.scheduler import start_scheduler, shutdown_scheduler  # noqa: E402

# Route modules (same as app/main.py, just re-registered with clean prefixes)
from app.routes import settings as settings_router  # noqa: E402
from app.routes import staff as staff_router  # noqa: E402
from app.routes import audit as audit_router  # noqa: E402
from app.routes import menu as menu_router  # noqa: E402
from app.routes import orders as orders_router  # noqa: E402
from app.routes import tables as tables_router  # noqa: E402
from app.routes import inventory as inventory_router  # noqa: E402
from app.routes import customers as customers_router  # noqa: E402
from app.routes import offers as offers_router  # noqa: E402
from app.routes import notifications as notifications_router  # noqa: E402
from app.routes import billing as billing_router  # noqa: E402
from app.routes import analytics as analytics_router  # noqa: E402
from app.routes import recipes as recipes_router  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
        print("[admin_sub] MongoDB connected")
        await start_scheduler()
    except Exception as exc:  # pragma: no cover
        print(f"[admin_sub] startup warning: {exc}")
    yield
    shutdown_scheduler()


admin_sub = FastAPI(title="RMS Admin API", lifespan=lifespan)

# CORS — allow same-origin (frontend served by unified backend or same static host)
_extra = os.getenv("CORS_EXTRA_ORIGINS", "")
_origins = [o.strip() for o in _extra.split(",") if o.strip()] or ["*"]

admin_sub.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.onrender\.com|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routers (no /api prefix — parent mount at /api/admin handles it) ─────────
admin_sub.include_router(settings_router.router,      prefix="/settings")
admin_sub.include_router(staff_router.router,         prefix="/staff")
admin_sub.include_router(audit_router.router,         prefix="/audit")
admin_sub.include_router(menu_router.router,          prefix="/menu")
admin_sub.include_router(orders_router.router,        prefix="/orders")
admin_sub.include_router(tables_router.router,        prefix="/tables")
admin_sub.include_router(inventory_router.router,     prefix="/inventory")
admin_sub.include_router(recipes_router.router,       prefix="/recipes")
admin_sub.include_router(customers_router.router,     prefix="/customers")
admin_sub.include_router(offers_router.router,        prefix="/offers")
admin_sub.include_router(notifications_router.router, prefix="/notifications")
admin_sub.include_router(billing_router.router,       prefix="/billing")
admin_sub.include_router(analytics_router.router,     prefix="/analytics")


@admin_sub.get("/health")
async def health():
    return {"status": "healthy", "service": "RMS Admin API"}


@admin_sub.post("/seed")
async def seed(secret: str = ""):
    """Seed admin DB.  POST /api/admin/seed?secret=seed123"""
    from fastapi import HTTPException
    from datetime import datetime
    from passlib.hash import pbkdf2_sha256

    expected = os.getenv("SEED_SECRET", "seed123")
    if secret != expected:
        raise HTTPException(status_code=403, detail="Invalid secret")

    try:
        db = get_db()
    except RuntimeError:
        init_db()
        db = get_db()

    staff_data = [
        {"name": "Admin User",   "email": "admin@restaurant.com",   "role": "admin",   "password": "admin123"},
        {"name": "Manager User", "email": "manager@restaurant.com", "role": "manager", "password": "manager123"},
        {"name": "Chef User",    "email": "chef@restaurant.com",    "role": "chef",    "password": "chef123"},
        {"name": "Waiter User",  "email": "waiter@restaurant.com",  "role": "waiter",  "password": "waiter123"},
        {"name": "Cashier User", "email": "cashier@restaurant.com", "role": "cashier", "password": "cashier123"},
    ]
    created = 0
    errors: list[str] = []
    coll = db.get_collection("staff")
    for s in staff_data:
        try:
            if not await coll.find_one({"email": s["email"].lower()}):
                await coll.insert_one({
                    "name": s["name"],
                    "email": s["email"].lower(),
                    "role": s["role"],
                    "password_hash": pbkdf2_sha256.hash(s["password"]),
                    "active": True,
                    "createdAt": datetime.utcnow(),
                })
                created += 1
        except Exception as exc:
            errors.append(f"{s['email']}: {exc}")

    return {"success": True, "created": created, "errors": errors}
