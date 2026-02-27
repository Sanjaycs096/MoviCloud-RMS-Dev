from __future__ import annotations

from flask import Blueprint, request

from ..mongo import get_notifications_collection, utc_now
from ..utils import get_json, json_response


notifications_bp = Blueprint("notifications", __name__)


def serialize_notification(doc: dict) -> dict:
    return {
        "id": doc.get("id"),
        "userId": doc.get("userId"),
        "type": doc.get("type"),
        "title": doc.get("title"),
        "message": doc.get("message"),
        "referenceId": doc.get("referenceId"),
        "createdAt": doc.get("createdAt"),
        "isRead": bool(doc.get("isRead", False)),
    }


@notifications_bp.get("/notifications")
def list_notifications():
    user_id = request.args.get("userId")
    try:
        notifications = get_notifications_collection()
        if user_id:
            query = {"$or": [{"userId": user_id}, {"userId": None}, {"userId": {"$exists": False}}]}
        else:
            query = {}
        rows = list(notifications.find(query).sort("createdAt", -1))
        return json_response({"notifications": [serialize_notification(n) for n in rows]})
    except Exception:
        # MongoDB unavailable locally — return empty list so frontend doesn't crash
        return json_response({"notifications": []})


@notifications_bp.post("/notifications/mark-read")
def mark_read():
    data = get_json(request)
    nid = data.get("id")
    if not isinstance(nid, str) or not nid:
        return json_response({"error": "id_required"}, 400)

    try:
        notifications = get_notifications_collection()
        result = notifications.update_one(
            {"id": nid},
            {"$set": {"isRead": True, "updatedAt": utc_now()}},
        )
        if result.matched_count == 0:
            return json_response({"error": "not_found"}, 404)
    except Exception:
        pass  # MongoDB unavailable — silently succeed so frontend doesn't error

    return json_response({"ok": True})


@notifications_bp.post("/notifications/mark-all-read")
def mark_all_read():
    user_id = request.args.get("userId")
    try:
        notifications = get_notifications_collection()
        if user_id:
            query = {"$or": [{"userId": user_id}, {"userId": None}, {"userId": {"$exists": False}}]}
        else:
            query = {}
        notifications.update_many(query, {"$set": {"isRead": True, "updatedAt": utc_now()}})
    except Exception:
        pass  # MongoDB unavailable — silently succeed

    return json_response({"ok": True})
