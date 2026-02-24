from __future__ import annotations

from flask import Blueprint, request

from ..mongo import get_menu_collection
from ..utils import get_json, json_response


chat_bp = Blueprint("chat", __name__)


def _menu_item_shape(doc: dict) -> dict:
    raw_id = doc.get("id") or (str(doc["_id"]) if doc.get("_id") else "")
    veg_types = {"vegetarian", "veg", "vegan", "jain"}
    is_veg = bool(doc.get("isVeg")) or str(doc.get("dietType", "")).lower() in veg_types
    return {
        "id": raw_id,
        "name": doc.get("name"),
        "price": doc.get("price"),
        "image": doc.get("image") or "",
        "category": doc.get("category"),
        "isVeg": is_veg,
    }


@chat_bp.post("/chat")
def chat():
    """Minimal chatbot API.

    Frontend currently has a full local rule-based chatbot.
    This endpoint is provided so the UI can be switched later.
    """

    data = get_json(request)
    message = str(data.get("message", "")).strip().lower()

    if not message:
        return json_response({"reply": "Please type a message."})

    menu = get_menu_collection()

    # very small intent handling to keep behaviour stable
    if "special" in message:
        specials = list(menu.find({"todaysSpecial": True}).limit(6))
        return json_response(
            {
                "reply": "Here are today's specials.",
                "items": [_menu_item_shape(i) for i in specials],
            }
        )

    if "popular" in message:
        popular = list(menu.find({"popular": True}).limit(6))
        return json_response(
            {
                "reply": "Here are some popular items.",
                "items": [_menu_item_shape(i) for i in popular],
            }
        )

    return json_response({"reply": "I can help with menu, specials, and popular items. Try 'today specials'."})
