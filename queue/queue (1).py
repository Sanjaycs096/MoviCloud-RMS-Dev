from __future__ import annotations

from datetime import datetime
from typing import Dict, Any

from flask import Blueprint, request

from ..mongo import get_queue_collection, get_reservations_collection, utc_now
from ..utils import get_json, json_response


queue_bp = Blueprint("queue", __name__)


# ─── field mapping ────────────────────────────────────────────────────────────
# Queue timeSlot:       "07:30-08:50"       (hyphen)
# Reservation timeSlot: "7:30 AM – 8:50 AM" (en-dash + AM/PM)

QUEUE_TO_RESERVATION_TIMESLOT = {
    "07:30-08:50": "7:30 AM \u2013 8:50 AM",
    "09:10-10:30": "9:10 AM \u2013 10:30 AM",
    "12:00-13:20": "12:00 PM \u2013 1:20 PM",
    "13:40-15:00": "1:40 PM \u2013 3:00 PM",
    "18:40-20:00": "6:40 PM \u2013 8:00 PM",
    "20:20-21:40": "8:20 PM \u2013 9:40 PM",
}


def map_hall_to_location(hall: str) -> str:
    mapping = {"AC": "ac hall", "Main": "main hall", "VIP": "vip hall", "Any": "any"}
    return mapping.get(hall, hall.lower())


def serialize_entry(e: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": e.get("id"),
        "userId": e.get("userId"),
        "name": e.get("name"),
        "guests": e.get("guests"),
        "notificationMethod": e.get("notificationMethod"),
        "contact": e.get("contact"),
        "hall": e.get("hall"),
        "segment": e.get("segment"),
        "position": e.get("position"),
        "estimatedWaitMinutes": e.get("estimatedWaitMinutes"),
        "joinedAt": e.get("joinedAt"),
        "queueDate": e.get("queueDate"),
        "timeSlot": e.get("timeSlot"),
        "timeSlotDisplay": e.get("timeSlotDisplay"),
        "notifiedAt15Min": e.get("notifiedAt15Min", False),
        "tableAvailable": e.get("tableAvailable", False),
        "notificationExpiresAt": e.get("notificationExpiresAt"),
        "fromReservationCancellation": e.get("fromReservationCancellation", False),
    }


# ─── routes (static before dynamic!) ─────────────────────────────────────────

@queue_bp.get("/queue")
def list_queue():
    queue_date = request.args.get("queueDate")
    user_id = request.args.get("userId")

    queue_col = get_queue_collection()
    query = {}
    if queue_date:
        query["queueDate"] = queue_date
    if user_id:
        query["userId"] = user_id

    entries = list(queue_col.find(query).sort([
        ("queueDate", -1), ("timeSlot", 1), ("position", 1)
    ]))
    return json_response({"entries": [serialize_entry(e) for e in entries]})


@queue_bp.post("/queue/join")
def join_queue():
    data = get_json(request)

    required = ["id", "name", "guests", "contact", "hall", "segment", "queueDate", "timeSlot"]
    for k in required:
        if k not in data:
            return json_response({"error": f"{k}_required"}, 400)

    queue_col = get_queue_collection()

    position = _calculate_position(
        data["queueDate"], data["timeSlot"],
        int(data["guests"]), data["hall"], data["segment"]
    )

    entry = {
        "id": str(data["id"]),
        "userId": data.get("userId", data.get("contact")),
        "name": str(data["name"]),
        "guests": int(data["guests"]),
        "notificationMethod": data.get("notificationMethod", "sms"),
        "contact": str(data["contact"]),
        "hall": str(data["hall"]),
        "segment": str(data["segment"]),
        "position": position,
        "estimatedWaitMinutes": _calculate_wait_time(data["queueDate"], data["timeSlot"]),
        "joinedAt": data.get("joinedAt", utc_now()),
        "queueDate": str(data["queueDate"]),
        "timeSlot": str(data["timeSlot"]),
        "timeSlotDisplay": _get_time_slot_display(data["timeSlot"]),
        "notifiedAt15Min": False,
        "tableAvailable": False,
        "notificationExpiresAt": None,
        "fromReservationCancellation": False,
    }

    queue_col.replace_one({"id": entry["id"]}, entry, upsert=True)
    return json_response(serialize_entry(entry), 201)


# ✅ STATIC — must be before /queue/<entry_id>
@queue_bp.get("/queue/check-availability")
def check_slot_availability():
    """
    Check if a reservation exists for this slot.
    Handles all field mismatches between queue and reservation collections:
      - timeSlot: "07:30-08:50" → "7:30 AM – 8:50 AM"
      - hall: "AC" → "ac hall" (regex, case-insensitive)
      - segment: "Front" → matches "Front side Tables" (prefix match)
    """
    queue_date = request.args.get("queueDate")
    time_slot  = request.args.get("timeSlot")
    guests     = request.args.get("guests", type=int)
    hall       = request.args.get("hall")
    segment    = request.args.get("segment")

    if not all([queue_date, time_slot, hall, segment]):
        return json_response({"error": "missing_parameters"}, 400)

    reservations_col = get_reservations_collection()

    reservation_time_slot = QUEUE_TO_RESERVATION_TIMESLOT.get(time_slot, time_slot)

    query: Dict[str, Any] = {
        "date": queue_date,
        "timeSlot": reservation_time_slot,
    }

    if hall != "Any":
        query["location"] = {"$regex": map_hall_to_location(hall), "$options": "i"}

    if segment != "Any":
        query["segment"] = {"$regex": f"^{segment}", "$options": "i"}

    reservation = reservations_col.find_one(query)
    return json_response({
        "isReserved": reservation is not None,
        "available": reservation is None,
    })


# ✅ STATIC — frontend polls this every 5s to detect backend-triggered availability
@queue_bp.get("/queue/poll")
def poll_queue_status():
    """
    Frontend polls this every 5 seconds to detect:
    1. tableAvailable set by reservation cancellation (fromReservationCancellation=True)
    2. Auto-expire: if 3 mins passed since notificationExpiresAt → cancel entry automatically
    """
    user_id = request.args.get("userId")
    if not user_id:
        return json_response({"error": "userId_required"}, 400)

    queue_col = get_queue_collection()

    # Check if this user has a tableAvailable=True entry (set by reservation cancellation)
    notified_entry = queue_col.find_one({"userId": user_id, "tableAvailable": True})
    if notified_entry:
        expires_at = notified_entry.get("notificationExpiresAt")
        if expires_at:
            try:
                if isinstance(expires_at, str):
                    expires_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                    expires_dt = expires_dt.replace(tzinfo=None)
                else:
                    expires_dt = expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at

                if datetime.utcnow() > expires_dt:
                    # 3 minutes passed — auto cancel and resequence
                    queue_col.delete_one({"userId": user_id})
                    _resequence_queue(
                        notified_entry["queueDate"], notified_entry["timeSlot"],
                        notified_entry["guests"], notified_entry["hall"], notified_entry["segment"],
                    )
                    return json_response({"entry": None, "autoExpired": True})
            except Exception:
                pass

        return json_response({
            "entry": serialize_entry(notified_entry),
            "tableAvailable": True,
            "fromReservationCancellation": notified_entry.get("fromReservationCancellation", False),
        })

    # Normal entry — just return current state
    entry = queue_col.find_one({"userId": user_id})
    if not entry:
        return json_response({"entry": None, "tableAvailable": False})

    return json_response({"entry": serialize_entry(entry), "tableAvailable": False})


# ✅ STATIC — visit in browser to verify DB contents
@queue_bp.get("/queue/debug")
def debug_queue():
    """Visit /api/queue/debug in browser to verify stored data — remove in production"""
    queue_col = get_queue_collection()
    all_entries = list(queue_col.find({}))
    return json_response({
        "count": len(all_entries),
        "entries": [serialize_entry(e) for e in all_entries]
    })


# ✅ DYNAMIC — after all static routes
@queue_bp.delete("/queue/<entry_id>")
def cancel_queue(entry_id: str):
    queue_col = get_queue_collection()

    entry = queue_col.find_one({"id": entry_id})
    if not entry:
        return json_response({"error": "not_found"}, 404)

    queue_col.delete_one({"id": entry_id})
    _resequence_queue(
        entry["queueDate"], entry["timeSlot"],
        entry["guests"], entry["hall"], entry["segment"]
    )
    return json_response({"ok": True})


@queue_bp.patch("/queue/<entry_id>")
def update_queue_entry(entry_id: str):
    queue_col = get_queue_collection()

    entry = queue_col.find_one({"id": entry_id})
    if not entry:
        return json_response({"error": "not_found"}, 404)

    data = get_json(request)
    update_fields: Dict[str, Any] = {}

    if "notifiedAt15Min" in data:
        update_fields["notifiedAt15Min"] = bool(data["notifiedAt15Min"])
    if "tableAvailable" in data:
        update_fields["tableAvailable"] = bool(data["tableAvailable"])
    if "notificationExpiresAt" in data:
        update_fields["notificationExpiresAt"] = data["notificationExpiresAt"]
    if "estimatedWaitMinutes" in data:
        update_fields["estimatedWaitMinutes"] = float(data["estimatedWaitMinutes"])
    if "fromReservationCancellation" in data:
        update_fields["fromReservationCancellation"] = bool(data["fromReservationCancellation"])

    if update_fields:
        queue_col.update_one({"id": entry_id}, {"$set": update_fields})

    updated = queue_col.find_one({"id": entry_id})
    return json_response(serialize_entry(updated))


# ─── helpers ─────────────────────────────────────────────────────────────────

def _calculate_position(queue_date: str, time_slot: str, guests: int, hall: str, segment: str) -> int:
    queue_col = get_queue_collection()
    count = queue_col.count_documents({
        "queueDate": queue_date, "timeSlot": time_slot,
        "guests": guests, "hall": hall, "segment": segment,
    })
    return count + 1


def _calculate_wait_time(queue_date: str, time_slot: str) -> float:
    try:
        start_time = time_slot.split("-")[0].strip()
        hour, minute = map(int, start_time.split(":"))
        year, month, day = map(int, queue_date.split("-"))
        slot_datetime = datetime(year, month, day, hour, minute)
        return max(0, (slot_datetime - datetime.utcnow()).total_seconds() / 60)
    except Exception:
        return 60.0


def _resequence_queue(queue_date: str, time_slot: str, guests: int, hall: str, segment: str) -> None:
    queue_col = get_queue_collection()
    entries = list(queue_col.find({
        "queueDate": queue_date, "timeSlot": time_slot,
        "guests": guests, "hall": hall, "segment": segment,
    }).sort("joinedAt", 1))

    for idx, entry in enumerate(entries, start=1):
        queue_col.update_one({"id": entry["id"]}, {"$set": {"position": idx}})


def _get_time_slot_display(time_slot: str) -> str:
    return {
        "07:30-08:50": "7:30 AM - 8:50 AM",
        "09:10-10:30": "9:10 AM - 10:30 AM",
        "12:00-13:20": "12:00 PM - 1:20 PM",
        "13:40-15:00": "1:40 PM - 3:00 PM",
        "18:40-20:00": "6:40 PM - 8:00 PM",
        "20:20-21:40": "8:20 PM - 9:40 PM",
    }.get(time_slot, time_slot)