"""
Analytics Routes
- Dashboard analytics
- Reports data
"""

from fastapi import APIRouter
from datetime import datetime, timedelta
from ..db import get_db

router = APIRouter(tags=["Analytics"])


@router.get("")
async def get_analytics():
    """Get dashboard analytics"""
    db = get_db()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Total orders
    total_orders = await db.orders.count_documents({})
    
    # Completed orders
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Active orders (in progress)
    active_orders = await db.orders.count_documents({
        "status": {"$in": ["pending", "confirmed", "preparing", "ready"]}
    })
    
    # Total revenue from completed orders
    revenue_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Average order value
    avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0
    
    # Popular items
    popular_pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "count": {"$sum": "$items.quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
        {"$project": {"name": "$_id", "count": 1, "_id": 0}}
    ]
    popular_items = await db.orders.aggregate(popular_pipeline).to_list(5)
    
    # Table occupancy
    total_tables = await db.tables.count_documents({})
    occupied_tables = await db.tables.count_documents({"status": "occupied"})
    table_occupancy = (occupied_tables / total_tables * 100) if total_tables > 0 else 0
    
    return {
        "success": True,
        "data": {
            "totalOrders": total_orders,
            "completedOrders": completed_orders,
            "totalRevenue": total_revenue,
            "avgOrderValue": avg_order_value,
            "popularItems": popular_items,
            "tableOccupancy": table_occupancy,
            "activeOrders": active_orders,
        }
    }


@router.get("/daily")
async def get_daily_analytics(date: str = None):
    """Get analytics for a specific date"""
    db = get_db()
    
    if date:
        target_date = datetime.fromisoformat(date)
    else:
        target_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    next_day = target_date + timedelta(days=1)
    
    # Orders for the day
    orders_pipeline = [
        {"$match": {"createdAt": {"$gte": target_date, "$lt": next_day}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "revenue": {"$sum": "$total"},
            "completed": {"$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}}
        }}
    ]
    orders_result = await db.orders.aggregate(orders_pipeline).to_list(1)
    
    # Hourly breakdown
    hourly_pipeline = [
        {"$match": {"createdAt": {"$gte": target_date, "$lt": next_day}}},
        {"$group": {
            "_id": {"$hour": "$createdAt"},
            "orders": {"$sum": 1},
            "revenue": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]
    hourly_result = await db.orders.aggregate(hourly_pipeline).to_list(24)
    
    return {
        "date": target_date.isoformat()[:10],
        "orders": orders_result[0]["total"] if orders_result else 0,
        "revenue": orders_result[0]["revenue"] if orders_result else 0,
        "completed": orders_result[0]["completed"] if orders_result else 0,
        "hourly": [{"hour": h["_id"], "orders": h["orders"], "revenue": h["revenue"]} for h in hourly_result]
    }


@router.get("/weekly")
async def get_weekly_analytics():
    """Get analytics for the past week"""
    db = get_db()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    
    # Daily breakdown for the week
    daily_pipeline = [
        {"$match": {"createdAt": {"$gte": week_ago}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
            "orders": {"$sum": 1},
            "revenue": {"$sum": "$total"}
        }},
        {"$sort": {"_id": 1}}
    ]
    daily_result = await db.orders.aggregate(daily_pipeline).to_list(7)
    
    # Top items for the week
    top_items_pipeline = [
        {"$match": {"createdAt": {"$gte": week_ago}}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "count": {"$sum": "$items.quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    top_items = await db.orders.aggregate(top_items_pipeline).to_list(10)
    
    return {
        "startDate": week_ago.isoformat()[:10],
        "endDate": today.isoformat()[:10],
        "daily": [{"date": d["_id"], "orders": d["orders"], "revenue": d["revenue"]} for d in daily_result],
        "topItems": [{"name": i["_id"], "count": i["count"]} for i in top_items]
    }
