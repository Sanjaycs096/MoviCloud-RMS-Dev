from __future__ import annotations

from datetime import datetime
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

from pymongo import MongoClient

# ── Load .env: try local backend/.env first, then Admin_side/.env as fallback (dev only) ──
# On Render, MONGODB_URI must be set as an environment variable in the dashboard.
_local_env = Path(__file__).resolve().parent / ".env"
_admin_env = Path(__file__).resolve().parents[2] / "Admin_side" / "backend" / ".env"
if _local_env.exists():
    load_dotenv(dotenv_path=_local_env)
elif _admin_env.exists():
    load_dotenv(dotenv_path=_admin_env)
else:
    load_dotenv()  # Let python-dotenv search standard locations

# Admin_side uses MONGODB_URI; extract DB name from the URI path
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/restaurant_db")
# DB name is the last segment of the URI path (e.g. /restaurant_db)
MONGO_DB_NAME = MONGO_URI.rstrip("/").rsplit("/", 1)[-1].split("?")[0].strip()

_client: Optional[MongoClient] = None


def _get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def get_db():
    client = _get_client()
    if MONGO_DB_NAME:
        return client.get_database(MONGO_DB_NAME)
    return client.get_database()


def get_users_collection():
    db = get_db()
    users = db.get_collection("users")
    try:
        users.create_index("email", unique=True)
    except Exception:
        # Index creation can race on startup; ignore if it already exists.
        pass
    return users


def get_menu_collection():
    db = get_db()
    menu = db.get_collection("menu_items")
    try:
        menu.create_index("id", unique=True)
        menu.create_index("category")
        menu.create_index("isVeg")
    except Exception:
        pass
    return menu


def get_feedback_collection():
    db = get_db()
    feedback = db.get_collection("feedback")
    try:
        feedback.create_index("id", unique=True)
        feedback.create_index("userId")
        feedback.create_index("orderId")
        feedback.create_index("createdAt")
    except Exception:
        pass
    return feedback


def get_orders_collection():
    db = get_db()
    orders = db.get_collection("orders")
    try:
        orders.create_index("id", unique=True)
        orders.create_index("userId")
        orders.create_index("date")
    except Exception:
        pass
    return orders


def get_reservations_collection():
    db = get_db()
    reservations = db.get_collection("reservations")
    try:
        reservations.create_index("reservationId", unique=True)
        reservations.create_index("userId")
        reservations.create_index("date")
        reservations.create_index("timeSlot")
    except Exception:
        pass
    return reservations


def get_waiting_queue_collection():
    db = get_db()
    waiting = db.get_collection("reservation_waiting_queue")
    try:
        waiting.create_index("queueId", unique=True)
        waiting.create_index("userId")
        waiting.create_index("date")
        waiting.create_index("timeSlot")
    except Exception:
        pass
    return waiting


def get_notifications_collection():
    db = get_db()
    col = db.get_collection("notifications")
    try:
        col.create_index("id", unique=True, sparse=True)
        col.create_index("userId")
        col.create_index("createdAt")
        col.create_index("isRead")
    except Exception:
        pass
    return col


def get_queue_collection():
    db = get_db()
    col = db.get_collection("queue_entries")
    try:
        col.create_index("id", unique=True)
        col.create_index("userId")
        col.create_index("queueDate")
        col.create_index("timeSlot")
        col.create_index([("queueDate", 1), ("guests", 1), ("hall", 1), ("segment", 1)])  # compound for position calculation
    except Exception:
        pass
    return col


def utc_now() -> str:
    return datetime.utcnow().isoformat() + "Z"
