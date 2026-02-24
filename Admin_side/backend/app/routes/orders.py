"""
Order Management Routes
- CRUD for orders
- Order status updates
- Order statistics
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from ..db import get_db
from ..audit import log_audit

router = APIRouter(tags=["Orders"])


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    doc["id"] = doc["_id"]  # Add id field for frontend compatibility
    
    # Convert datetime fields to ISO format with timezone
    datetime_fields = ["createdAt", "updatedAt", "statusUpdatedAt", "completedAt", "cancelledAt", "occupiedAt"]
    for field in datetime_fields:
        if field in doc and doc[field] is not None:
            if isinstance(doc[field], datetime):
                doc[field] = doc[field].isoformat() + 'Z'
            elif isinstance(doc[field], str) and not doc[field].endswith('Z'):
                # Already a string but missing Z, add it
                doc[field] = doc[field] + 'Z' if 'T' in doc[field] else doc[field]
    
    return doc


# ============ ORDERS ============

@router.get("")
async def list_orders(
    status: Optional[str] = None,
    type: Optional[str] = None,
    table: Optional[int] = None,
    waiter_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(100, le=500),
    skip: int = 0,
):
    """Get all orders with optional filters"""
    db = get_db()
    query = {}
    
    if status and status != "all":
        query["status"] = status
    if type and type != "all":
        query["type"] = type
    if table:
        query["tableNumber"] = table
    if waiter_id and waiter_id != "all":
        query["waiterId"] = waiter_id
    if date_from:
        query["createdAt"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "createdAt" in query:
            query["createdAt"]["$lte"] = datetime.fromisoformat(date_to)
        else:
            query["createdAt"] = {"$lte": datetime.fromisoformat(date_to)}
    
    orders = await db.orders.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {"data": [serialize_doc(order) for order in orders], "total": total}


@router.get("/stats")
async def get_order_stats():
    """Get order statistics"""
    db = get_db()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_today = await db.orders.count_documents({"createdAt": {"$gte": today}})
    pending = await db.orders.count_documents({"status": {"$in": ["placed", "preparing"]}})
    ready = await db.orders.count_documents({"status": "ready"})
    completed_today = await db.orders.count_documents({
        "status": "completed",
        "createdAt": {"$gte": today}
    })
    
    # Revenue today
    revenue_pipeline = [
        {"$match": {"createdAt": {"$gte": today}, "status": {"$ne": "cancelled"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    revenue_today = revenue_result[0]["total"] if revenue_result else 0
    
    # Orders by type
    type_pipeline = [
        {"$match": {"createdAt": {"$gte": today}}},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    type_result = await db.orders.aggregate(type_pipeline).to_list(10)
    by_type = {t["_id"]: t["count"] for t in type_result if t["_id"]}
    
    return {
        "totalToday": total_today,
        "pending": pending,
        "ready": ready,
        "completedToday": completed_today,
        "revenueToday": revenue_today,
        "byType": by_type,
    }


@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get single order"""
    db = get_db()
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_doc(order)


@router.post("")
async def create_order(data: dict):
    """Create new order"""
    try:
        db = get_db()
        
        # Remove id and _id fields to let MongoDB generate them
        # This prevents duplicate key errors when frontend sends id: null
        data.pop("id", None)
        data.pop("_id", None)
        
        # Generate order number
        count = await db.orders.count_documents({})
        data["orderNumber"] = f"#ORD-{count + 1001}"
        data["createdAt"] = datetime.utcnow().isoformat() + 'Z'
        data["status"] = data.get("status", "placed")
        data["statusUpdatedAt"] = datetime.utcnow().isoformat() + 'Z'
        
        result = await db.orders.insert_one(data)
        created = await db.orders.find_one({"_id": result.inserted_id})
        
        # Try to log audit but don't fail if it doesn't work
        try:
            await log_audit("create", "order", str(result.inserted_id), {
                "orderNumber": data["orderNumber"],
                "total": data.get("total")
            })
        except Exception as e:
            print(f"Audit log error: {e}")
        
        return serialize_doc(created)
    except Exception as e:
        print(f"Error creating order: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.put("/{order_id}")
async def update_order(order_id: str, data: dict):
    """Update order"""
    db = get_db()
    
    data["updatedAt"] = datetime.utcnow().isoformat() + 'Z'
    data.pop("_id", None)
    data.pop("id", None)  # Remove id field to prevent index conflicts
    
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated = await db.orders.find_one({"_id": ObjectId(order_id)})
    await log_audit("update", "order", order_id)
    
    return serialize_doc(updated)


# Helper function for inventory deduction (imported from recipes module)
async def call_inventory_deduction(order_id: str, items: list):
    """Helper to call inventory deduction from recipes module"""
    from .recipes import deduct_inventory_for_order
    return await deduct_inventory_for_order({"orderId": order_id, "items": items})


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, status: str, deduct_inventory: bool = True):
    """
    Update order status with automatic flow integration.
    
    Flow:
    - placed → preparing: Triggers inventory deduction if deduct_inventory=true
    - preparing → ready: Notifies for serving
    - ready → served → completed: Updates billing/payment
    
    Query param `deduct_inventory` can be set to false to skip deduction (for re-printing etc.)
    """
    db = get_db()
    
    valid_statuses = ["placed", "preparing", "ready", "served", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get current order to check previous status
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    previous_status = order.get("status")
    
    # Update status
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status, "statusUpdatedAt": datetime.utcnow().isoformat() + 'Z'}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # FLOW INTEGRATION: Trigger inventory deduction when order starts preparing
    inventory_deducted = False
    deduction_result = None
    
    if status == "preparing" and deduct_inventory:
        items = order.get("items", [])
        if items:
            try:
                deduction_result = await call_inventory_deduction(order_id, items)
                inventory_deducted = True
            except Exception as e:
                # Log but don't fail the order update
                print(f"Inventory deduction error: {e}")
    
    # FLOW INTEGRATION: Create notification for kitchen/waiter
    if status == "ready":
        notification = {
            "type": "order_ready",
            "orderId": order_id,
            "orderNumber": order.get("orderNumber"),
            "tableNumber": order.get("tableNumber"),
            "message": f"Order {order.get('orderNumber')} is ready for serving",
            "createdAt": datetime.utcnow().isoformat() + 'Z'
        }
        await db.notifications.insert_one(notification)
    
    # FLOW INTEGRATION: Update payment when completed
    if status == "completed" and order.get("paymentStatus") != "paid":
        await db.orders.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"paymentStatus": "settled", "completedAt": datetime.utcnow().isoformat() + 'Z'}}
        )
    
    await log_audit("status_update", "order", order_id, {
        "newStatus": status,
        "previousStatus": previous_status,
        "inventoryDeducted": inventory_deducted
    })
    
    return {
        "success": True, 
        "status": status,
        "previousStatus": previous_status,
        "inventoryDeducted": inventory_deducted,
        "deductionResult": deduction_result
    }


@router.delete("/{order_id}")
async def delete_order(order_id: str):
    """Delete order (soft delete - mark as cancelled)"""
    db = get_db()
    
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": "cancelled", "cancelledAt": datetime.utcnow().isoformat() + 'Z'}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await log_audit("cancel", "order", order_id)
    
    return {"success": True}


# ============ KITCHEN DISPLAY ============

@router.get("/kitchen/queue")
async def get_kitchen_queue():
    """Get orders for kitchen display"""
    db = get_db()
    
    orders = await db.orders.find({
        "status": {"$in": ["placed", "preparing", "ready"]}
    }).sort("createdAt", 1).to_list(50)
    
    return [serialize_doc(order) for order in orders]


@router.patch("/{order_id}/item-status")
async def update_item_status(order_id: str, item_index: int, status: str):
    """Update individual item status in order"""
    db = get_db()
    
    result = await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {f"items.{item_index}.status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True}


# ============ KITCHEN WORKFLOW ENDPOINTS ============

@router.post("/kitchen/start-preparing/{order_id}")
async def start_preparing_order(order_id: str):
    """
    Start preparing an order in kitchen.
    This triggers:
    1. Order status changed to 'preparing'
    2. Inventory deduction based on recipes
    3. Kitchen timer starts
    """
    return await update_order_status(order_id, "preparing", deduct_inventory=True)


@router.post("/kitchen/mark-ready/{order_id}")
async def mark_order_ready(order_id: str):
    """
    Mark order as ready in kitchen.
    This triggers:
    1. Order status changed to 'ready'
    2. Notification sent to waiters
    """
    return await update_order_status(order_id, "ready", deduct_inventory=False)


@router.post("/kitchen/complete/{order_id}")
async def complete_order_serving(order_id: str):
    """
    Complete order serving.
    This triggers:
    1. Order status changed to 'completed'
    2. Payment status updated
    3. Order completion time recorded
    """
    return await update_order_status(order_id, "completed", deduct_inventory=False)


@router.get("/kitchen/active-orders")
async def get_active_kitchen_orders():
    """
    Get all active orders for kitchen display.
    Returns orders in: placed, preparing, ready states
    """
    db = get_db()
    
    orders = await db.orders.find({
        "status": {"$in": ["placed", "preparing", "ready"]}
    }).sort([
        ("status", 1),  # placed first, then preparing, then ready
        ("createdAt", 1)  # oldest first within status
    ]).to_list(100)
    
    # Enhance with timing info
    result = []
    for order in orders:
        doc = serialize_doc(order)
        # Calculate time elapsed
        created = order.get("createdAt")
        if created:
            elapsed = (datetime.utcnow() - created).total_seconds()
            doc["elapsedMinutes"] = int(elapsed / 60)
            # Add urgency flag
            doc["isUrgent"] = elapsed > 600  # 10 minutes
        result.append(doc)
    
    return result


@router.get("/kitchen/stats")
async def get_kitchen_stats():
    """Get kitchen statistics"""
    db = get_db()
    
    placed = await db.orders.count_documents({"status": "placed"})
    preparing = await db.orders.count_documents({"status": "preparing"})
    ready = await db.orders.count_documents({"status": "ready"})
    
    # Average prep time (for completed orders in last hour)
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_completed = await db.orders.find({
        "status": "completed",
        "completedAt": {"$gte": one_hour_ago}
    }).to_list(100)
    
    avg_time = 0
    if recent_completed:
        total_time = sum([
            (o.get("completedAt") - o.get("createdAt")).total_seconds() 
            for o in recent_completed 
            if o.get("completedAt") and o.get("createdAt")
        ])
        avg_time = int(total_time / len(recent_completed) / 60) if total_time > 0 else 0
    
    return {
        "pending": placed,
        "inProgress": preparing,
        "readyToServe": ready,
        "avgPrepTimeMinutes": avg_time,
        "totalActive": placed + preparing + ready
    }


# ============ WORKFLOW INTEGRATION ============

@router.post("/workflow/process-order")
async def process_order_workflow(data: dict):
    """
    Complete workflow for processing an order.
    Coordinates between Orders, Kitchen, Inventory, and Billing.
    
    Expected data:
    {
        "orderId": "...",
        "action": "start_preparing|mark_ready|serve|complete|cancel",
        "items": [...] // Only needed for start_preparing
    }
    """
    action = data.get("action")
    order_id = data.get("orderId")
    
    if not order_id or not action:
        raise HTTPException(status_code=400, detail="orderId and action are required")
    
    valid_actions = ["start_preparing", "mark_ready", "serve", "complete", "cancel"]
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action. Must be one of: {valid_actions}")
    
    # Map actions to status
    action_to_status = {
        "start_preparing": "preparing",
        "mark_ready": "ready",
        "serve": "served",
        "complete": "completed",
        "cancel": "cancelled"
    }
    
    deduct = action == "start_preparing"
    new_status = action_to_status[action]
    
    return await update_order_status(order_id, new_status, deduct_inventory=deduct)


@router.post("/fix-indexes")
async def fix_orders_indexes():
    """
    Migration endpoint to fix the duplicate key error on orders.
    Drops the problematic 'id' index and removes 'id' field from all documents.
    """
    db = get_db()
    results = {"dropped_index": False, "removed_id_fields": 0, "errors": []}
    
    # Try to drop the id_1 index
    try:
        await db.orders.drop_index("id_1")
        results["dropped_index"] = True
    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower() or "index not found" in error_msg.lower():
            results["dropped_index"] = "not_found"
        else:
            results["errors"].append(f"Failed to drop index: {error_msg}")
    
    # Remove id field from all documents that have it
    try:
        update_result = await db.orders.update_many(
            {"id": {"$exists": True}},
            {"$unset": {"id": ""}}
        )
        results["removed_id_fields"] = update_result.modified_count
    except Exception as e:
        results["errors"].append(f"Failed to remove id fields: {str(e)}")
    
    return results
