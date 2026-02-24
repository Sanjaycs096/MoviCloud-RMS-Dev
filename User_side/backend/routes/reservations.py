from __future__ import annotations

from flask import Blueprint, request

from ..mongo import get_reservations_collection, get_waiting_queue_collection, utc_now, get_db
from ..utils import get_json, json_response


reservations_bp = Blueprint("reservations", __name__)


# ── Shared admin tables collection ────────────────────────────────────────────

def _get_admin_tables() -> list:
    """Return tables from the shared MongoDB 'tables' collection (managed by admin).
    Falls back to 12 default indoor tables when none are configured yet.
    """
    db = get_db()
    docs = list(db.get_collection("tables").find({}).sort("name", 1))
    if not docs:
        docs = [
            {"name": f"Table {i}", "location": "Indoor", "segment": "Main", "capacity": 4}
            for i in range(1, 13)
        ]
    return docs


def serialize_table(doc: dict, table_number: int) -> dict:
    return {
        "tableId": f"T{str(table_number).zfill(3)}",
        "tableName": doc.get("name") or doc.get("tableName") or f"Table {table_number}",
        "location": doc.get("location") or "",
        "segment": doc.get("segment") or doc.get("area") or "Main",
        "capacity": int(doc.get("capacity") or doc.get("seats") or 4),
    }


def serialize_reservation(doc: dict) -> dict:
    return {
        "reservationId": doc.get("reservationId"),
        "userId": doc.get("userId"),
        "tableNumber": doc.get("tableNumber"),
        "date": doc.get("date"),
        "timeSlot": doc.get("timeSlot"),
        "guests": doc.get("guests"),
        "location": doc.get("location"),
        "segment": doc.get("segment"),
        "userName": doc.get("userName"),
        "userPhone": doc.get("userPhone"),
        "status": doc.get("status"),
    }


def serialize_waiting(doc: dict) -> dict:
    return {
        "queueId": doc.get("queueId"),
        "userId": doc.get("userId"),
        "date": doc.get("date"),
        "timeSlot": doc.get("timeSlot"),
        "guests": doc.get("guests"),
        "position": doc.get("position"),
        "estimatedWait": doc.get("estimatedWait"),
    }


@reservations_bp.get("/tables")
def list_tables():
    tables = _get_admin_tables()
    return json_response({"tables": [serialize_table(t, i + 1) for i, t in enumerate(tables)]})


@reservations_bp.get("/reservations")
def list_reservations():
    user_id = request.args.get("userId")
    reservations = get_reservations_collection()
    query = {"userId": user_id} if user_id else {}
    res = list(reservations.find(query).sort([("date", -1), ("timeSlot", 1)]))
    return json_response({"reservations": [serialize_reservation(r) for r in res]})


@reservations_bp.post("/reservations")
def create_reservation():
    data = get_json(request)

    required = ["reservationId", "userId", "date", "timeSlot", "guests", "location", "segment", "userName", "userPhone"]
    for k in required:
        if k not in data:
            return json_response({"error": f"{k}_required"}, 400)

    # assign table number if missing
    table_number = data.get("tableNumber")
    if not isinstance(table_number, int):
        table_number = _get_next_available_table(data["date"], data["timeSlot"])
        if table_number is None:
            return json_response({"error": "no_tables_available"}, 409)

    doc = {
        "reservationId": str(data["reservationId"]),
        "userId": str(data["userId"]),
        "tableNumber": int(table_number),
        "date": str(data["date"]),
        "timeSlot": str(data["timeSlot"]),
        "guests": int(data["guests"]),
        "location": str(data["location"]),
        "segment": str(data["segment"]),
        "userName": str(data["userName"]),
        "userPhone": str(data["userPhone"]),
        "status": str(data.get("status", "Confirmed")),
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
    }

    reservations = get_reservations_collection()
    reservations.update_one(
        {"reservationId": doc["reservationId"]},
        {"$set": doc},
        upsert=True,
    )

    return json_response(serialize_reservation(doc), 201)


@reservations_bp.delete("/reservations/<reservation_id>")
def delete_reservation(reservation_id: str):
    reservations = get_reservations_collection()
    result = reservations.delete_one({"reservationId": reservation_id})
    if result.deleted_count == 0:
        return json_response({"error": "not_found"}, 404)
    return json_response({"ok": True})


@reservations_bp.get("/reservations/availability")
def availability():
    date = request.args.get("date")
    time_slot = request.args.get("timeSlot")
    if not date or not time_slot:
        return json_response({"error": "date_and_timeSlot_required"}, 400)

    location = request.args.get("location", "any")
    segment = request.args.get("segment", "any")
    guests = int(request.args.get("guests", "2"))

    reservations = get_reservations_collection()
    reserved_table_numbers = {
        int(r.get("tableNumber", 0))
        for r in reservations.find({"date": date, "timeSlot": time_slot}, {"tableNumber": 1})
        if r.get("tableNumber")
    }

    tables = _get_admin_tables()

    result = []
    for i, doc in enumerate(tables):
        table_number = i + 1
        loc = str(doc.get("location") or "")
        seg = str(doc.get("segment") or doc.get("area") or "Main")
        cap = int(doc.get("capacity") or doc.get("seats") or 4)
        location_match = (location == "any") or (loc.lower() == location.lower())
        segment_match = (segment == "any") or (segment.lower().split(" ")[0] in seg.lower())
        capacity_match = cap >= guests
        if location_match and segment_match and capacity_match:
            is_available = table_number not in reserved_table_numbers
            result.append({**serialize_table(doc, table_number), "isAvailable": is_available})

    show_waiting = all(not x["isAvailable"] for x in result) and len(result) > 0

    return json_response({"tables": result, "showWaitingQueueOption": show_waiting})


@reservations_bp.get("/reservation-waiting-queue")
def list_waiting_queue():
    user_id = request.args.get("userId")
    waiting = get_waiting_queue_collection()
    query = {"userId": user_id} if user_id else {}
    rows = list(waiting.find(query).sort([("date", -1), ("timeSlot", 1), ("position", 1)]))
    return json_response({"entries": [serialize_waiting(x) for x in rows]})


@reservations_bp.post("/reservation-waiting-queue")
def join_waiting_queue():
    data = get_json(request)
    required = ["queueId", "userId", "date", "timeSlot", "guests"]
    for k in required:
        if k not in data:
            return json_response({"error": f"{k}_required"}, 400)

    position = _next_waiting_position(str(data["date"]), str(data["timeSlot"]))
    estimated_wait = f"{max(5, position * 10)}-{max(10, position * 10 + 5)} mins"

    entry = {
        "queueId": str(data["queueId"]),
        "userId": str(data["userId"]),
        "date": str(data["date"]),
        "timeSlot": str(data["timeSlot"]),
        "guests": int(data["guests"]),
        "position": position,
        "estimatedWait": estimated_wait,
        "createdAt": utc_now(),
        "updatedAt": utc_now(),
    }

    waiting = get_waiting_queue_collection()
    waiting.update_one(
        {"queueId": entry["queueId"]},
        {"$set": entry},
        upsert=True,
    )
    return json_response(serialize_waiting(entry), 201)


@reservations_bp.delete("/reservation-waiting-queue/<queue_id>")
def delete_waiting_entry(queue_id: str):
    waiting = get_waiting_queue_collection()
    result = waiting.delete_one({"queueId": queue_id})
    if result.deleted_count == 0:
        return json_response({"error": "not_found"}, 404)
    return json_response({"ok": True})


def _get_next_available_table(date: str, time_slot: str):
    reservations = get_reservations_collection()
    reserved = {
        int(r.get("tableNumber", 0))
        for r in reservations.find({"date": date, "timeSlot": time_slot}, {"tableNumber": 1})
        if r.get("tableNumber")
    }

    total = max(len(_get_admin_tables()), 12)
    for n in range(1, total + 1):
        if n not in reserved:
            return n
    return None


def _next_waiting_position(date: str, time_slot: str) -> int:
    waiting = get_waiting_queue_collection()
    count = waiting.count_documents({"date": date, "timeSlot": time_slot})
    return int(count) + 1
