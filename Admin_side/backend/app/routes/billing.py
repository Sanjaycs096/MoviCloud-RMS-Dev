"""
Billing & Payment Routes
- Payments processing
- Payment history
- Reports
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
from bson import ObjectId
from ..db import get_db
from ..audit import log_audit

router = APIRouter(tags=["Billing"])


def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable dict"""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc


# ============ PAYMENTS ============

@router.get("")
async def list_payments(
    status: Optional[str] = None,
    method: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(100, le=500),
    skip: int = 0,
):
    """Get all payments"""
    db = get_db()
    query = {}
    
    if status and status != "all":
        query["status"] = status
    if method and method != "all":
        query["method"] = method
    if date_from:
        query["createdAt"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "createdAt" in query:
            query["createdAt"]["$lte"] = datetime.fromisoformat(date_to)
        else:
            query["createdAt"] = {"$lte": datetime.fromisoformat(date_to)}
    
    payments = await db.payments.find(query).sort("createdAt", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.payments.count_documents(query)
    
    return {"data": [serialize_doc(p) for p in payments], "total": total}


@router.get("/stats")
async def get_payment_stats():
    """Get payment statistics"""
    db = get_db()
    
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)
    month_start = today.replace(day=1)
    
    # Today's revenue
    today_pipeline = [
        {"$match": {"createdAt": {"$gte": today}, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    today_result = await db.payments.aggregate(today_pipeline).to_list(1)
    today_revenue = today_result[0]["total"] if today_result else 0
    today_count = today_result[0]["count"] if today_result else 0
    
    # This week's revenue
    week_pipeline = [
        {"$match": {"createdAt": {"$gte": week_ago}, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    week_result = await db.payments.aggregate(week_pipeline).to_list(1)
    week_revenue = week_result[0]["total"] if week_result else 0
    
    # This month's revenue
    month_pipeline = [
        {"$match": {"createdAt": {"$gte": month_start}, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    month_result = await db.payments.aggregate(month_pipeline).to_list(1)
    month_revenue = month_result[0]["total"] if month_result else 0
    
    # By payment method
    method_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": "$method", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    method_result = await db.payments.aggregate(method_pipeline).to_list(10)
    by_method = {m["_id"]: {"total": m["total"], "count": m["count"]} for m in method_result if m["_id"]}
    
    # Pending payments
    pending = await db.payments.count_documents({"status": "pending"})
    failed = await db.payments.count_documents({"status": "failed"})
    
    return {
        "todayRevenue": today_revenue,
        "todayTransactions": today_count,
        "weekRevenue": week_revenue,
        "monthRevenue": month_revenue,
        "byMethod": by_method,
        "pending": pending,
        "failed": failed,
    }


@router.get("/{payment_id}")
async def get_payment(payment_id: str):
    """Get single payment"""
    db = get_db()
    payment = await db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return serialize_doc(payment)


@router.post("")
async def create_payment(data: dict):
    """Record a payment"""
    db = get_db()
    
    # Generate transaction ID
    count = await db.payments.count_documents({})
    data["transactionId"] = f"TXN-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1001}"
    data["createdAt"] = datetime.utcnow()
    data["status"] = data.get("status", "completed")
    
    result = await db.payments.insert_one(data)
    created = await db.payments.find_one({"_id": result.inserted_id})
    
    # Update order payment status if linked
    if data.get("orderId"):
        await db.orders.update_one(
            {"_id": ObjectId(data["orderId"])},
            {"$set": {
                "paymentStatus": "paid",
                "paymentMethod": data.get("method"),
                "paidAt": datetime.utcnow()
            }}
        )
    
    await log_audit("create", "payment", str(result.inserted_id), {
        "amount": data.get("amount"),
        "method": data.get("method")
    })
    
    return serialize_doc(created)


@router.patch("/{payment_id}/status")
async def update_payment_status(payment_id: str, status: str):
    """Update payment status"""
    db = get_db()
    
    valid_statuses = ["pending", "completed", "failed", "refunded"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status")
    
    result = await db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {"status": status, "updatedAt": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    await log_audit("status_update", "payment", payment_id, {"status": status})
    
    return {"success": True, "status": status}


@router.post("/{payment_id}/refund")
async def refund_payment(payment_id: str, amount: Optional[float] = None, reason: Optional[str] = None):
    """Process a refund"""
    db = get_db()
    
    payment = await db.payments.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Can only refund completed payments")
    
    refund_amount = amount or payment.get("amount", 0)
    
    # Update original payment
    await db.payments.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": {
            "status": "refunded",
            "refundedAt": datetime.utcnow(),
            "refundAmount": refund_amount,
            "refundReason": reason
        }}
    )
    
    # Create refund record
    count = await db.payments.count_documents({})
    refund_record = {
        "transactionId": f"REF-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1}",
        "originalPaymentId": payment_id,
        "amount": -refund_amount,
        "method": payment.get("method"),
        "type": "refund",
        "status": "completed",
        "reason": reason,
        "createdAt": datetime.utcnow()
    }
    await db.payments.insert_one(refund_record)
    
    await log_audit("refund", "payment", payment_id, {"amount": refund_amount})
    
    return {"success": True, "refundAmount": refund_amount}


# ============ INVOICES ============

@router.get("/invoices/all")
async def list_invoices(
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = Query(100, le=500),
):
    """Get all invoices"""
    db = get_db()
    query = {}
    
    if date_from:
        query["createdAt"] = {"$gte": datetime.fromisoformat(date_from)}
    if date_to:
        if "createdAt" in query:
            query["createdAt"]["$lte"] = datetime.fromisoformat(date_to)
        else:
            query["createdAt"] = {"$lte": datetime.fromisoformat(date_to)}
    
    invoices = await db.invoices.find(query).sort("createdAt", -1).limit(limit).to_list(limit)
    return [serialize_doc(inv) for inv in invoices]


@router.post("/invoices")
async def create_invoice(data: dict):
    """Create invoice"""
    db = get_db()
    
    # Generate invoice number
    count = await db.invoices.count_documents({})
    data["invoiceNumber"] = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1001}"
    data["createdAt"] = datetime.utcnow()
    
    result = await db.invoices.insert_one(data)
    created = await db.invoices.find_one({"_id": result.inserted_id})
    
    return serialize_doc(created)


# ============ TAX SETTINGS ============

@router.get("/tax-settings")
async def get_tax_settings():
    """Get tax configuration"""
    db = get_db()
    
    settings = await db.settings.find_one({"key": "tax_settings"})
    if not settings:
        # Return defaults
        return {
            "gstEnabled": True,
            "cgstRate": 2.5,
            "sgstRate": 2.5,
            "serviceChargeEnabled": True,
            "serviceChargeRate": 5,
            "roundingEnabled": True,
        }
    
    return settings.get("value", {})


@router.post("/tax-settings")
async def update_tax_settings(data: dict):
    """Update tax settings"""
    db = get_db()
    
    await db.settings.update_one(
        {"key": "tax_settings"},
        {"$set": {
            "key": "tax_settings",
            "value": data,
            "updatedAt": datetime.utcnow()
        }},
        upsert=True
    )
    
    await log_audit("update", "tax_settings", "tax_settings")
    
    return {"success": True, "settings": data}


# ============ DAILY REPORTS ============

@router.get("/reports/daily")
async def get_daily_report(date: Optional[str] = None):
    """Get daily financial report"""
    db = get_db()
    
    if date:
        start = datetime.fromisoformat(date)
    else:
        start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    end = start + timedelta(days=1)
    
    # Revenue
    revenue_pipeline = [
        {"$match": {"createdAt": {"$gte": start, "$lt": end}, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    revenue_result = await db.payments.aggregate(revenue_pipeline).to_list(1)
    
    # Orders
    orders_pipeline = [
        {"$match": {"createdAt": {"$gte": start, "$lt": end}}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    orders_result = await db.orders.aggregate(orders_pipeline).to_list(10)
    
    # By payment method
    method_pipeline = [
        {"$match": {"createdAt": {"$gte": start, "$lt": end}, "status": "completed"}},
        {"$group": {"_id": "$method", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]
    method_result = await db.payments.aggregate(method_pipeline).to_list(10)
    
    return {
        "date": start.isoformat()[:10],
        "revenue": revenue_result[0]["total"] if revenue_result else 0,
        "transactions": revenue_result[0]["count"] if revenue_result else 0,
        "ordersByStatus": {o["_id"]: o["count"] for o in orders_result if o["_id"]},
        "byPaymentMethod": {m["_id"]: {"total": m["total"], "count": m["count"]} for m in method_result if m["_id"]},
    }


# ============ ORDER-BILLING INTEGRATION ============

@router.post("/process-order-payment")
async def process_order_payment(data: dict):
    """
    Process payment for an order.
    Creates payment record and updates order payment status.
    
    Expected data:
    {
        "orderId": "...",
        "method": "cash|card|upi|wallet",
        "amount": 500.00,
        "tips": 50.00  // optional
    }
    """
    db = get_db()
    
    order_id = data.get("orderId")
    method = data.get("method", "cash")
    amount = data.get("amount")
    tips = data.get("tips", 0)
    
    if not order_id or not amount:
        raise HTTPException(status_code=400, detail="orderId and amount are required")
    
    # Get order details
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if already paid
    if order.get("paymentStatus") == "paid":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Generate transaction ID
    count = await db.payments.count_documents({})
    transaction_id = f"TXN-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1001}"
    
    # Create payment record
    payment_data = {
        "orderId": order_id,
        "orderNumber": order.get("orderNumber"),
        "tableNumber": order.get("tableNumber"),
        "transactionId": transaction_id,
        "amount": amount,
        "tips": tips,
        "total": amount + tips,
        "method": method,
        "status": "completed",
        "createdAt": datetime.utcnow()
    }
    
    result = await db.payments.insert_one(payment_data)
    
    # Update order payment status
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "paymentStatus": "paid",
            "paymentMethod": method,
            "paidAt": datetime.utcnow(),
            "paymentId": str(result.inserted_id)
        }}
    )
    
    await log_audit("payment", "order", order_id, {
        "amount": amount,
        "method": method,
        "transactionId": transaction_id
    })
    
    return {
        "success": True,
        "paymentId": str(result.inserted_id),
        "transactionId": transaction_id,
        "amount": amount,
        "method": method
    }


@router.get("/order/{order_id}/payment")
async def get_order_payment(order_id: str):
    """Get payment details for an order"""
    db = get_db()
    
    # Find payment by orderId
    payment = await db.payments.find_one({"orderId": order_id})
    if not payment:
        return {"found": False}
    
    return serialize_doc(payment)


@router.post("/checkout")
async def checkout_order(data: dict):
    """
    Complete checkout process for an order.
    Processes payment and marks order as completed in one call.
    
    Expected data:
    {
        "orderId": "...",
        "method": "cash|card|upi|wallet",
        "amount": 500.00,
        "tips": 50.00  // optional
    }
    """
    db = get_db()
    
    # First process payment
    payment_result = await process_order_payment(data)
    
    order_id = data.get("orderId")
    
    # Then mark order as completed
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "status": "completed",
            "statusUpdatedAt": datetime.utcnow(),
            "completedAt": datetime.utcnow()
        }}
    )
    
    await log_audit("checkout", "order", order_id, {
        "payment": payment_result
    })
    
    return {
        "success": True,
        "message": "Order completed and paid",
        "payment": payment_result
    }
