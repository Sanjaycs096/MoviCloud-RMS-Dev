from __future__ import annotations

from flask import Blueprint, request

from ..mongo import get_db
from ..utils import json_response


offers_bp = Blueprint("offers", __name__)


# ── field mapping: admin coupons → user Offer shape ──────────────────────────
def _coupon_to_offer(doc: dict) -> dict:
    raw_id = doc.get("_id")
    offer_id = doc.get("code") or (str(raw_id) if raw_id else "")

    discount = doc.get("discount") or doc.get("value") or 0
    discount_type = str(doc.get("discountType") or doc.get("type") or "percentage").lower()
    offer_type = "PERCENT" if "percent" in discount_type or "%" in discount_type else "FLAT"

    title = doc.get("title") or doc.get("description")
    if not title:
        unit = "%" if offer_type == "PERCENT" else "\u20b9"
        title = f"{unit}{discount} OFF"
        min_val = doc.get("minOrderValue") or doc.get("minimumOrderAmount")
        if min_val:
            title += f" on orders above \u20b9{min_val}"

    return {
        "id": offer_id,
        "title": title,
        "type": offer_type,
        "value": float(discount),
        "minOrderValue": doc.get("minOrderValue") or doc.get("minimumOrderAmount"),
        "requiresLoyalty": bool(doc.get("requiresLoyalty", False)),
        "validUntil": doc.get("validUntil") or doc.get("expiryDate"),
    }


@offers_bp.get("/offers")
def list_offers():
    db = get_db()
    coupons = list(
        db.get_collection("coupons")
        .find({"status": "active"})
        .sort("createdAt", -1)
    )
    return json_response({"offers": [_coupon_to_offer(c) for c in coupons]})


@offers_bp.get("/offers/eligible")
def eligible_offers():
    try:
        subtotal = float(request.args.get("subtotal", "0"))
    except ValueError:
        subtotal = 0
    try:
        loyalty_points = int(request.args.get("loyaltyPoints", "0"))
    except ValueError:
        loyalty_points = 0

    db = get_db()
    coupons = list(
        db.get_collection("coupons")
        .find({"status": "active"})
        .sort("createdAt", -1)
    )

    eligible = []
    for c in coupons:
        min_val = c.get("minOrderValue") or c.get("minimumOrderAmount") or 0
        requires_loyalty = bool(c.get("requiresLoyalty", False))
        if subtotal >= min_val:
            if not requires_loyalty or loyalty_points > 0:
                eligible.append(_coupon_to_offer(c))

    return json_response({"offers": eligible})
