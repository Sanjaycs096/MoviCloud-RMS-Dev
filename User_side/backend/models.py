from __future__ import annotations

from datetime import datetime
import json

from .db import db


class User(db.Model):
    """Local SQLite user store — used as fallback when MongoDB is unavailable."""
    __tablename__ = "users"

    email = db.Column(db.String(200), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(32), nullable=False, default="")
    address = db.Column(db.Text, nullable=False, default="")
    password_hash = db.Column(db.Text, nullable=False)
    loyalty_points = db.Column(db.Integer, nullable=False, default=100)
    favorites_json = db.Column(db.Text, nullable=False, default="[]")
    membership_json = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow,
                           onupdate=datetime.utcnow)

    def to_doc(self) -> dict:
        return {
            "email": self.email,
            "name": self.name,
            "phone": self.phone,
            "address": self.address,
            "passwordHash": self.password_hash,
            "loyaltyPoints": self.loyalty_points,
            "favorites": json.loads(self.favorites_json or "[]"),
            "membership": json.loads(self.membership_json) if self.membership_json else None,
        }


class MenuItem(db.Model):
    __tablename__ = "menu_items"

    id = db.Column(db.String(32), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Integer, nullable=False)
    image = db.Column(db.Text, nullable=False)
    is_veg = db.Column(db.Boolean, nullable=False, default=True)
    category = db.Column(db.String(64), nullable=False)
    available = db.Column(db.Boolean, nullable=False, default=True)
    popular = db.Column(db.Boolean, nullable=False, default=False)
    todays_special = db.Column(db.Boolean, nullable=False, default=False)
    calories = db.Column(db.Integer, nullable=False, default=0)
    prep_time = db.Column(db.String(32), nullable=False, default="")
    offer = db.Column(db.String(64), nullable=True)


class Offer(db.Model):
    __tablename__ = "offers"

    id = db.Column(db.String(32), primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(16), nullable=False)  # PERCENT | FLAT
    value = db.Column(db.Integer, nullable=False)
    min_order_value = db.Column(db.Integer, nullable=True)
    requires_loyalty = db.Column(db.Boolean, nullable=False, default=False)


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(db.String(200), nullable=True)
    items_json = db.Column(db.Text, nullable=False)  # JSON list

    subtotal = db.Column(db.Float, nullable=True)
    tax = db.Column(db.Float, nullable=True)
    loyalty_discount = db.Column(db.Float, nullable=True)
    loyalty_points_redeemed = db.Column(db.Integer, nullable=True)
    total = db.Column(db.Float, nullable=False)

    status = db.Column(db.String(32), nullable=False)
    type = db.Column(db.String(16), nullable=False)  # dine-in | takeaway
    date = db.Column(db.String(64), nullable=False)  # ISO string
    delivery_address = db.Column(db.Text, nullable=True)
    invoice_url = db.Column(db.Text, nullable=True)


class Table(db.Model):
    __tablename__ = "tables"

    table_id = db.Column(db.String(16), primary_key=True)
    table_name = db.Column(db.String(120), nullable=False)
    location = db.Column(db.String(64), nullable=False)
    segment = db.Column(db.String(64), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)


class TableReservation(db.Model):
    __tablename__ = "table_reservations"

    reservation_id = db.Column(db.String(32), primary_key=True)
    user_id = db.Column(db.String(200), nullable=False)
    table_number = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(16), nullable=False)  # YYYY-MM-DD
    time_slot = db.Column(db.String(64), nullable=False)
    guests = db.Column(db.Integer, nullable=False)
    location = db.Column(db.String(64), nullable=False)
    segment = db.Column(db.String(64), nullable=False)
    user_name = db.Column(db.String(120), nullable=False)
    user_phone = db.Column(db.String(32), nullable=False)
    status = db.Column(db.String(16), nullable=False, default="Confirmed")


class WaitingQueueEntry(db.Model):
    __tablename__ = "reservation_waiting_queue"

    queue_id = db.Column(db.String(32), primary_key=True)
    user_id = db.Column(db.String(200), nullable=False)
    date = db.Column(db.String(16), nullable=False)  # YYYY-MM-DD
    time_slot = db.Column(db.String(64), nullable=False)
    guests = db.Column(db.Integer, nullable=False)
    position = db.Column(db.Integer, nullable=False)
    estimated_wait = db.Column(db.String(32), nullable=False)


class QueueEntry(db.Model):
    __tablename__ = "queue_entries"

    id = db.Column(db.String(64), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    guests = db.Column(db.Integer, nullable=False)
    notification_method = db.Column(db.String(16), nullable=False)  # sms|email
    contact = db.Column(db.String(200), nullable=False)
    hall = db.Column(db.String(16), nullable=False)  # AC|Main|VIP|Any
    segment = db.Column(db.String(16), nullable=False)  # Front|Middle|Back|Any
    position = db.Column(db.Integer, nullable=False)
    estimated_wait_minutes = db.Column(db.Float, nullable=False)
    joined_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    queue_date = db.Column(db.String(16), nullable=False)  # YYYY-MM-DD
    notified_at_5_min = db.Column(db.Boolean, nullable=False, default=False)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(64), primary_key=True)
    user_id = db.Column(db.String(200), nullable=True)
    type = db.Column(db.String(16), nullable=False)  # success|pending|failed|info
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    reference_id = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
