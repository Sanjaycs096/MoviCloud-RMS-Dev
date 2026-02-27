from __future__ import annotations

import re

from flask import Blueprint, request

from ..mongo import get_menu_collection
from ..utils import json_response


menu_bp = Blueprint("menu", __name__)


# ── Veg diet types used by admin side ──────────────────────────────────────────
_VEG_DIET_TYPES = {"vegetarian", "veg", "vegan", "jain"}


def _is_veg(doc: dict) -> bool:
    """Resolve isVeg from either the isVeg bool field OR admin's dietType string."""
    if "isVeg" in doc and isinstance(doc["isVeg"], bool):
        return doc["isVeg"]
    diet = str(doc.get("dietType") or "").lower().strip()
    return diet in _VEG_DIET_TYPES


def _prep_time(doc: dict) -> str:
    """Map both user's prepTime string and admin's preparationTime int."""
    pt = doc.get("prepTime")
    if isinstance(pt, str) and pt:
        return pt
    mins = doc.get("preparationTime")
    if isinstance(mins, (int, float)) and mins > 0:
        return f"{int(mins)}-{int(mins) + 5} mins"
    return ""


def _offer_str(doc: dict) -> str | None:
    """Normalise offer: accept admin's {discount, label} object OR plain string."""
    offer = doc.get("offer")
    if not offer:
        return None
    if isinstance(offer, str):
        return offer
    if isinstance(offer, dict):
        disc = offer.get("discount") or offer.get("value")
        label = offer.get("label") or offer.get("title")
        if disc:
            return label if label else f"{disc}% OFF"
    return None


# Map any variant a document may have been saved with → canonical Title-Case name
_CATEGORY_MAP: dict[str, str] = {
    "starters": "Starters",
    "starter": "Starters",
    "main-course": "Main Course",
    "main course": "Main Course",
    "main_course": "Main Course",
    "maincourse": "Main Course",
    "breads": "Breads",
    "bread": "Breads",
    "desserts": "Desserts",
    "dessert": "Desserts",
    "beverages": "Beverages",
    "beverage": "Beverages",
    "drinks": "Beverages",
    "salads": "Salads",
    "salad": "Salads",
    "sides": "Sides",
    "side": "Sides",
}


def _normalize_category(cat: str | None) -> str | None:
    """Return canonical category name; unknown values are title-cased."""
    if not cat:
        return cat
    return _CATEGORY_MAP.get(cat.strip().lower(), cat)


def serialize_menu_item(doc: dict) -> dict:
    # Resolve id: prefer explicit string 'id', fall back to '_id' (ObjectId)
    item_id = doc.get("id")
    if not item_id:
        raw_id = doc.get("_id")
        item_id = str(raw_id) if raw_id is not None else ""

    return {
        "id": item_id,
        "name": doc.get("name"),
        "description": doc.get("description") or "",
        "price": doc.get("price"),
        "image": doc.get("image") or "",
        "isVeg": _is_veg(doc),
        "category": _normalize_category(doc.get("category")),
        "available": bool(doc.get("available", True)),
        "popular": bool(doc.get("popular", False)),
        "todaysSpecial": bool(doc.get("todaysSpecial", False)),
        "calories": doc.get("calories") or 0,
        "prepTime": _prep_time(doc),
        "offer": _offer_str(doc),
        # Pass through extra admin fields so frontend can use them
        "cuisine": doc.get("cuisine"),
        "dietType": doc.get("dietType"),
        "spiceLevel": doc.get("spiceLevel"),
    }


def _get_sqlite_items() -> list:
    """
    Read menu items from SQLite (seeds the table first if empty).
    Returns list of plain dicts — same shape as MongoDB documents.
    Safe to call inside any Flask request context.
    """
    from ..db import db as flask_db
    from ..models import MenuItem

    flask_db.create_all()
    items = MenuItem.query.all()
    if not items:
        from ..seed import seed_menu_items, seed_offers, seed_tables
        seed_menu_items(flask_db.session)
        seed_offers(flask_db.session)
        seed_tables(flask_db.session)
        flask_db.session.commit()
        items = MenuItem.query.all()

    return [
        {
            "id": item.id,
            "name": item.name,
            "description": item.description or "",
            "price": item.price,
            "image": item.image or "",
            "isVeg": bool(item.is_veg),
            "category": item.category or "",
            "available": bool(item.available),
            "popular": bool(item.popular),
            "todaysSpecial": bool(getattr(item, "todays_special", False)),
            "calories": item.calories or 0,
            "prepTime": item.prep_time or "",
            "offer": item.offer,
        }
        for item in items
    ]


def _build_mongo_query(category, veg, q) -> dict:
    query: dict = {}
    if category and category != "All":
        query["category"] = category
    if veg in ("true", "false"):
        want_veg = veg == "true"
        if want_veg:
            query["$or"] = [
                {"isVeg": True},
                {"dietType": {"$in": list(_VEG_DIET_TYPES)}},
            ]
        else:
            query["$and"] = [
                {"isVeg": {"$ne": True}},
                {"dietType": {"$nin": list(_VEG_DIET_TYPES)}},
            ]
    if q:
        regex = re.compile(re.escape(q), re.IGNORECASE)
        q_clause = {"$or": [{"name": regex}, {"description": regex}]}
        if "$and" in query:
            query["$and"].append(q_clause)
        elif "$or" in query:
            query = {"$and": [{"$or": query.pop("$or")}, q_clause]}
        else:
            query.update(q_clause)
    return query


def _apply_sqlite_filters(docs: list, category, veg, q) -> list:
    if category and category != "All":
        docs = [d for d in docs if d.get("category") == category]
    if veg == "true":
        docs = [d for d in docs if d.get("isVeg")]
    elif veg == "false":
        docs = [d for d in docs if not d.get("isVeg")]
    if q:
        ql = q.lower()
        docs = [
            d for d in docs
            if ql in (d.get("name") or "").lower()
            or ql in (d.get("description") or "").lower()
        ]
    return sorted(docs, key=lambda d: (d.get("category") or "", d.get("name") or ""))


@menu_bp.get("/menu-items")
def list_menu_items():
    category = request.args.get("category")
    veg = request.args.get("veg")   # 'true'|'false'
    q = request.args.get("q")

    # ── 1. Try MongoDB ─────────────────────────────────────────────────────────
    try:
        menu = get_menu_collection()
        query = _build_mongo_query(category, veg, q)
        items = list(menu.find(query).sort([("category", 1), ("name", 1)]))

        # Collection is empty on an unfiltered request → auto-seed from SQLite
        if not items and not query:
            try:
                sqlite_docs = _get_sqlite_items()
                for doc in sqlite_docs:
                    menu.update_one({"id": doc["id"]}, {"$setOnInsert": doc}, upsert=True)
                print(f"[menu] ✓ Auto-seeded {len(sqlite_docs)} items into MongoDB")
                items = list(menu.find({}).sort([("category", 1), ("name", 1)]))
            except Exception as seed_exc:
                print(f"[menu] MongoDB seed error (will use SQLite fallback): {seed_exc}")

        if items:
            return json_response({"items": [serialize_menu_item(i) for i in items]})

    except Exception as mongo_exc:
        print(f"[menu] MongoDB unavailable, using SQLite fallback: {mongo_exc}")

    # ── 2. SQLite fallback (always works) ──────────────────────────────────────
    try:
        sqlite_docs = _get_sqlite_items()
        filtered = _apply_sqlite_filters(sqlite_docs, category, veg, q)
        print(f"[menu] Serving {len(filtered)} items from SQLite fallback")
        return json_response({"items": [serialize_menu_item(d) for d in filtered]})
    except Exception as sqlite_exc:
        print(f"[menu] SQLite fallback failed: {sqlite_exc}")
        return json_response({"items": [], "error": "Menu service temporarily unavailable"}, 503)


@menu_bp.get("/menu-items/<item_id>")
def get_menu_item(item_id: str):
    # Try MongoDB first
    try:
        menu = get_menu_collection()
        item = menu.find_one({"id": item_id})
        if not item:
            try:
                from bson import ObjectId
                item = menu.find_one({"_id": ObjectId(item_id)})
            except Exception:
                pass
        if item:
            return json_response(serialize_menu_item(item))
    except Exception:
        pass

    # SQLite fallback
    try:
        sqlite_docs = _get_sqlite_items()
        item = next((d for d in sqlite_docs if d.get("id") == item_id), None)
        if item:
            return json_response(serialize_menu_item(item))
    except Exception:
        pass

    return json_response({"error": "not_found"}, 404)


@menu_bp.get("/menu/categories")
def list_categories():
    """Return all distinct categories — falls back to SQLite if MongoDB is empty/unavailable."""
    try:
        menu = get_menu_collection()
        cats = sorted(c for c in menu.distinct("category") if c)
        if cats:
            return json_response({"categories": ["All", *cats]})
    except Exception as exc:
        print(f"[menu] categories: MongoDB unavailable: {exc}")

    # SQLite fallback
    try:
        from ..models import MenuItem
        cats = sorted(set(i.category for i in MenuItem.query.all() if i.category))
        return json_response({"categories": ["All", *cats]})
    except Exception:
        return json_response({"categories": ["All"]})
