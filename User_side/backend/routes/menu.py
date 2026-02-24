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


@menu_bp.get("/menu-items")
def list_menu_items():
    category = request.args.get("category")
    veg = request.args.get("veg")  # 'true'|'false'
    q = request.args.get("q")

    menu = get_menu_collection()
    query: dict = {}

    if category and category != "All":
        query["category"] = category

    if veg in ("true", "false"):
        want_veg = veg == "true"
        if want_veg:
            # Accept items that are veg by either old isVeg bool OR admin dietType
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

    items = list(menu.find(query).sort([("category", 1), ("name", 1)]))
    return json_response({"items": [serialize_menu_item(i) for i in items]})


@menu_bp.get("/menu-items/<item_id>")
def get_menu_item(item_id: str):
    menu = get_menu_collection()
    # Try string id first, then ObjectId
    item = menu.find_one({"id": item_id})
    if not item:
        try:
            from bson import ObjectId
            item = menu.find_one({"_id": ObjectId(item_id)})
        except Exception:
            pass
    if not item:
        return json_response({"error": "not_found"}, 404)
    return json_response(serialize_menu_item(item))


@menu_bp.get("/menu/categories")
def list_categories():
    """Return all distinct categories present in the menu_items collection."""
    menu = get_menu_collection()
    cats = sorted(c for c in menu.distinct("category") if c)
    # Always prepend "All" so the frontend category bar works without changes
    return json_response({"categories": ["All", *cats]})
