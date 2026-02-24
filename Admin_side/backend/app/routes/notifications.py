"""
Notification Management Routes
- Notifications CRUD
- Notification settings
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from ..db import get_db
from ..audit import log_audit

router = APIRouter(tags=["Notifications"])


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


# ============ NOTIFICATIONS ============

@router.get("")
async def list_notifications(
    type: Optional[str] = None,
    status: Optional[str] = None,
    channel: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0,
):
    """Get all notifications"""
    db = get_db()
    query = {}
    
    if type and type != "all":
        query["type"] = type
    if status and status != "all":
        query["status"] = status
    if channel and channel != "all":
        query["channel"] = channel
    
    notifications = await db.notifications.find(query).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.notifications.count_documents(query)
    
    return {"data": [serialize_doc(n) for n in notifications], "total": total}


@router.get("/stats")
async def get_notification_stats():
    """Get notification statistics"""
    db = get_db()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    total = await db.notifications.count_documents({})
    sent = await db.notifications.count_documents({"status": "sent"})
    failed = await db.notifications.count_documents({"status": "failed"})
    pending = await db.notifications.count_documents({"status": "pending"})
    today_count = await db.notifications.count_documents({"timestamp": {"$gte": today}})
    
    # By channel
    channel_pipeline = [
        {"$group": {"_id": "$channel", "count": {"$sum": 1}}}
    ]
    channel_result = await db.notifications.aggregate(channel_pipeline).to_list(10)
    by_channel = {c["_id"]: c["count"] for c in channel_result if c["_id"]}
    
    # By type
    type_pipeline = [
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    type_result = await db.notifications.aggregate(type_pipeline).to_list(10)
    by_type = {t["_id"]: t["count"] for t in type_result if t["_id"]}
    
    return {
        "total": total,
        "sent": sent,
        "failed": failed,
        "pending": pending,
        "todayCount": today_count,
        "byChannel": by_channel,
        "byType": by_type,
    }


@router.get("/{notification_id}")
async def get_notification(notification_id: str):
    """Get single notification"""
    db = get_db()
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return serialize_doc(notification)


@router.post("")
async def create_notification(data: dict):
    """Create new notification"""
    db = get_db()
    
    data["timestamp"] = datetime.utcnow()
    data["status"] = data.get("status", "pending")
    
    result = await db.notifications.insert_one(data)
    created = await db.notifications.find_one({"_id": result.inserted_id})
    
    return serialize_doc(created)


@router.post("/send")
async def send_notification(notification_id: Optional[str] = None, data: Optional[dict] = None):
    """Send a notification (simulated)"""
    db = get_db()
    
    # If notification_id is provided, mark existing notification as sent
    if notification_id:
        notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        await db.notifications.update_one(
            {"_id": ObjectId(notification_id)},
            {"$set": {
                "status": "sent",
                "sentAt": datetime.utcnow()
            }}
        )
        
        await log_audit("send", "notification", notification_id, {
            "type": notification.get("type"),
            "channel": notification.get("channel")
        })
        
        updated = await db.notifications.find_one({"_id": ObjectId(notification_id)})
        return serialize_doc(updated)
    
    # Otherwise create and send new notification
    if not data:
        data = {}
    
    data["timestamp"] = datetime.utcnow()
    data["status"] = "sent"  # In real implementation, this would be based on actual send result
    data["sentAt"] = datetime.utcnow()
    
    result = await db.notifications.insert_one(data)
    created = await db.notifications.find_one({"_id": result.inserted_id})
    
    await log_audit("send", "notification", str(result.inserted_id), {
        "type": data.get("type"),
        "channel": data.get("channel")
    })
    
    return serialize_doc(created)


@router.post("/{notification_id}/retry")
async def retry_notification(notification_id: str):
    """Retry a failed notification"""
    db = get_db()
    
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Simulate retry
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {
            "status": "sent",
            "retriedAt": datetime.utcnow(),
            "retryCount": notification.get("retryCount", 0) + 1
        }}
    )
    
    return {"success": True, "status": "sent"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete notification"""
    db = get_db()
    
    result = await db.notifications.delete_one({"_id": ObjectId(notification_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"success": True}


# ============ NOTIFICATION SETTINGS ============

@router.get("/settings/all")
async def get_notification_settings():
    """Get notification settings"""
    db = get_db()
    
    settings = await db.settings.find_one({"key": "notification_settings"})
    if not settings:
        # Return defaults
        return {
            "channels": {
                "email": True,
                "sms": False,
                "push": True,
            },
            "alerts": {
                "orderAlerts": True,
                "paymentAlerts": True,
                "reservationAlerts": True,
                "inventoryAlerts": True,
                "staffAlerts": False,
            },
        }
    
    return settings.get("value", {})


@router.post("/settings")
async def update_notification_settings(data: dict):
    """Update notification settings"""
    db = get_db()
    
    await db.settings.update_one(
        {"key": "notification_settings"},
        {"$set": {
            "key": "notification_settings",
            "value": data,
            "updatedAt": datetime.utcnow()
        }},
        upsert=True
    )
    
    await log_audit("update", "notification_settings", "notification_settings")
    
    return {"success": True, "settings": data}


# ============ BROADCAST ============

@router.post("/broadcast")
async def send_broadcast(data: dict):
    """Send broadcast notification to multiple recipients"""
    db = get_db()
    
    # Accept both recipientIds (frontend) and recipients for compatibility
    recipients = data.get("recipientIds", data.get("recipients", []))
    message = data.get("message", "")
    title = data.get("title", "")
    channel = data.get("channel", "push")
    
    notifications = []
    for recipient in recipients:
        notification = {
            "type": "broadcast",
            "title": title,
            "message": message,
            "recipient": recipient,
            "channel": channel,
            "status": "sent",
            "timestamp": datetime.utcnow(),
        }
        notifications.append(notification)
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    await log_audit("broadcast", "notification", None, {"count": len(recipients)})
    
    return {"success": True, "sentCount": len(notifications)}
