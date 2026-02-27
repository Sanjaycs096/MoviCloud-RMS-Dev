from __future__ import annotations

import json
from typing import Any

import bcrypt
from flask import Blueprint, request

from ..mongo import get_users_collection, utc_now
from ..utils import get_json, json_response


auth_bp = Blueprint("auth", __name__)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _serialize_user(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "phone": doc.get("phone", ""),
        "address": doc.get("address", ""),
        "password": "",
        "loyaltyPoints": doc.get("loyaltyPoints", 0),
        "favorites": doc.get("favorites", []),
        "membership": doc.get("membership"),
    }


def _default_membership() -> dict[str, Any]:
    return {
        "plan": "gold",
        "status": "active",
        "monthlyPrice": 299,
        "pointsBoost": 25,
        "benefits": [
            "+25% loyalty points on all orders",
            "Exclusive member-only coupons",
            "Free delivery on orders above 500",
            "Priority customer support",
        ],
        "expiryDate": "2026-06-30",
    }


# ── SQLite helpers ─────────────────────────────────────────────────────────────

def _sqlite_find_user(email: str):
    from ..db import db as flask_db
    from ..models import User
    flask_db.create_all()
    return User.query.get(email)


def _sqlite_create_user(doc: dict) -> None:
    from ..db import db as flask_db
    from ..models import User
    flask_db.create_all()
    user = User(
        email=doc["email"],
        name=doc["name"],
        phone=doc.get("phone", ""),
        address=doc.get("address", ""),
        password_hash=doc["passwordHash"],
        loyalty_points=doc.get("loyaltyPoints", 100),
        favorites_json=json.dumps(doc.get("favorites", [])),
        membership_json=json.dumps(doc.get("membership")) if doc.get("membership") else None,
    )
    flask_db.session.merge(user)
    flask_db.session.commit()


def _sqlite_update_user(email: str, updates: dict) -> None:
    from ..db import db as flask_db
    from ..models import User
    flask_db.create_all()
    user = User.query.get(email)
    if not user:
        return
    if "name" in updates:
        user.name = updates["name"]
    if "phone" in updates:
        user.phone = updates["phone"]
    if "address" in updates:
        user.address = updates["address"]
    if "loyaltyPoints" in updates:
        user.loyalty_points = updates["loyaltyPoints"]
    if "favorites" in updates:
        user.favorites_json = json.dumps(updates["favorites"])
    if "membership" in updates:
        user.membership_json = json.dumps(updates["membership"])
    if "passwordHash" in updates:
        user.password_hash = updates["passwordHash"]
    if "email" in updates and updates["email"] != email:
        # Email change: delete old row, create new
        flask_db.session.delete(user)
        flask_db.session.flush()
        new_user = User(
            email=updates["email"],
            name=user.name,
            phone=user.phone,
            address=user.address,
            password_hash=user.password_hash,
            loyalty_points=user.loyalty_points,
            favorites_json=user.favorites_json,
            membership_json=user.membership_json,
        )
        flask_db.session.add(new_user)
    flask_db.session.commit()


# ── Routes ─────────────────────────────────────────────────────────────────────

@auth_bp.post("/auth/register")
def register_user():
    data = get_json(request)
    required = ["name", "email", "phone", "address", "password"]
    missing = [field for field in required if not str(data.get(field, "")).strip()]
    if missing:
        return json_response({"error": "missing_fields", "fields": missing}, 400)

    email = _normalize_email(str(data["email"]))
    password = str(data["password"])
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    user_doc = {
        "name": str(data["name"]).strip(),
        "email": email,
        "phone": str(data["phone"]).strip(),
        "address": str(data["address"]).strip(),
        "passwordHash": password_hash,
        "loyaltyPoints": 100,
        "favorites": [],
        "membership": _default_membership(),
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
    }

    # ── 1. Try MongoDB ─────────────────────────────────────────────────────────
    try:
        users = get_users_collection()
        if users.find_one({"email": email}):
            return json_response({"error": "email_exists"}, 409)
        users.insert_one(user_doc)
        return json_response({"user": _serialize_user(user_doc)}, 201)
    except Exception as mongo_exc:
        print(f"[auth] MongoDB unavailable for register, using SQLite: {mongo_exc}")

    # ── 2. SQLite fallback ─────────────────────────────────────────────────────
    try:
        if _sqlite_find_user(email):
            return json_response({"error": "email_exists"}, 409)
        _sqlite_create_user(user_doc)
        return json_response({"user": _serialize_user(user_doc)}, 201)
    except Exception as sqlite_exc:
        print(f"[auth] SQLite register failed: {sqlite_exc}")
        return json_response({"error": "Registration service temporarily unavailable"}, 503)


@auth_bp.post("/auth/login")
def login_user():
    data = get_json(request)
    email = _normalize_email(str(data.get("email", "")))
    password = str(data.get("password", ""))

    if not email or not password:
        return json_response({"error": "missing_credentials"}, 400)

    # ── 1. Try MongoDB ─────────────────────────────────────────────────────────
    try:
        users = get_users_collection()
        user = users.find_one({"email": email})
        if user:
            password_hash = str(user.get("passwordHash", ""))
            if not password_hash or not bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8")):
                return json_response({"error": "invalid_credentials"}, 401)
            return json_response({"user": _serialize_user(user)})
        # User not found in Mongo — fall through to SQLite
    except Exception as mongo_exc:
        print(f"[auth] MongoDB unavailable for login, using SQLite: {mongo_exc}")

    # ── 2. SQLite fallback ─────────────────────────────────────────────────────
    try:
        sqlite_user = _sqlite_find_user(email)
        if not sqlite_user:
            return json_response({"error": "invalid_credentials"}, 401)
        password_hash = sqlite_user.password_hash
        if not password_hash or not bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8")):
            return json_response({"error": "invalid_credentials"}, 401)
        return json_response({"user": _serialize_user(sqlite_user.to_doc())})
    except Exception as sqlite_exc:
        print(f"[auth] SQLite login failed: {sqlite_exc}")
        return json_response({"error": "Login service temporarily unavailable"}, 503)


@auth_bp.patch("/users/<email>")
def update_user(email: str):
    data = get_json(request)
    current_email = _normalize_email(email)

    updates: dict[str, Any] = {}
    for field in ["name", "phone", "address", "favorites", "loyaltyPoints", "membership"]:
        if field in data:
            updates[field] = data[field]

    next_email = data.get("email")
    if isinstance(next_email, str) and next_email.strip():
        normalized = _normalize_email(next_email)
        if normalized != current_email:
            updates["email"] = normalized

    password = str(data.get("password", "")).strip()
    if password:
        updates["passwordHash"] = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # ── 1. Try MongoDB ─────────────────────────────────────────────────────────
    try:
        users = get_users_collection()
        user = users.find_one({"email": current_email})
        if not user:
            return json_response({"error": "not_found"}, 404)

        if "email" in updates:
            if users.find_one({"email": updates["email"]}):
                return json_response({"error": "email_exists"}, 409)

        if not updates:
            return json_response({"user": _serialize_user(user)})

        updates["updatedAt"] = utc_now()
        users.update_one({"email": current_email}, {"$set": updates})
        updated = users.find_one({"email": updates.get("email", current_email)})
        return json_response({"user": _serialize_user(updated or user)})
    except Exception as mongo_exc:
        print(f"[auth] MongoDB unavailable for update_user, using SQLite: {mongo_exc}")

    # ── 2. SQLite fallback ─────────────────────────────────────────────────────
    try:
        sqlite_user = _sqlite_find_user(current_email)
        if not sqlite_user:
            return json_response({"error": "not_found"}, 404)

        if not updates:
            return json_response({"user": _serialize_user(sqlite_user.to_doc())})

        _sqlite_update_user(current_email, updates)
        refreshed = _sqlite_find_user(updates.get("email", current_email))
        doc = refreshed.to_doc() if refreshed else sqlite_user.to_doc()
        return json_response({"user": _serialize_user(doc)})
    except Exception as sqlite_exc:
        print(f"[auth] SQLite update_user failed: {sqlite_exc}")
        return json_response({"error": "Update service temporarily unavailable"}, 503)

    return email.strip().lower()

