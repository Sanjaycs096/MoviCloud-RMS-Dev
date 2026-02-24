"""
Database Seeder Script
Run this script to populate the database with sample data for testing.

Usage:
    cd backend
    python -m app.seed
"""

import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from passlib.hash import pbkdf2_sha256

# Load environment
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')


# Sample Staff Accounts
SAMPLE_STAFF = [
    {"name": "Admin User", "email": "admin@restaurant.com", "phone": "+91 98765 00001", "role": "admin", "password": "admin123"},
    {"name": "Manager User", "email": "manager@restaurant.com", "phone": "+91 98765 00002", "role": "manager", "password": "manager123"},
    {"name": "Chef User", "email": "chef@restaurant.com", "phone": "+91 98765 00003", "role": "chef", "password": "chef123"},
    {"name": "Waiter User", "email": "waiter@restaurant.com", "phone": "+91 98765 00004", "role": "waiter", "password": "waiter123"},
    {"name": "Cashier User", "email": "cashier@restaurant.com", "phone": "+91 98765 00005", "role": "cashier", "password": "cashier123"},
]

# Sample Data
SAMPLE_INGREDIENTS = [
    {"name": "Basmati Rice", "category": "Grains", "stockLevel": 85, "unit": "kg", "minThreshold": 20, "costPerUnit": 90, "status": "Healthy", "usageRate": "High"},
    {"name": "Tomatoes", "category": "Produce", "stockLevel": 12, "unit": "kg", "minThreshold": 15, "costPerUnit": 40, "status": "Low", "usageRate": "High"},
    {"name": "Olive Oil", "category": "Oils", "stockLevel": 4, "unit": "L", "minThreshold": 5, "costPerUnit": 850, "status": "Critical", "usageRate": "Medium"},
    {"name": "Mozzarella Cheese", "category": "Dairy", "stockLevel": 25, "unit": "kg", "minThreshold": 10, "costPerUnit": 420, "status": "Healthy", "usageRate": "High"},
    {"name": "Chicken Breast", "category": "Meat", "stockLevel": 30, "unit": "kg", "minThreshold": 20, "costPerUnit": 280, "status": "Healthy", "usageRate": "High"},
    {"name": "Saffron", "category": "Spices", "stockLevel": 0.5, "unit": "kg", "minThreshold": 0.1, "costPerUnit": 150000, "status": "Healthy", "usageRate": "Low"},
    {"name": "Potatoes", "category": "Produce", "stockLevel": 45, "unit": "kg", "minThreshold": 30, "costPerUnit": 25, "status": "Healthy", "usageRate": "High"},
    {"name": "Onions", "category": "Produce", "stockLevel": 35, "unit": "kg", "minThreshold": 30, "costPerUnit": 30, "status": "Healthy", "usageRate": "High"},
    {"name": "Garlic", "category": "Produce", "stockLevel": 5, "unit": "kg", "minThreshold": 3, "costPerUnit": 150, "status": "Healthy", "usageRate": "Medium"},
    {"name": "Fresh Basil", "category": "Herbs", "stockLevel": 2, "unit": "kg", "minThreshold": 1, "costPerUnit": 300, "status": "Healthy", "usageRate": "Medium"},
]

SAMPLE_SUPPLIERS = [
    {"name": "Grain Masters", "contact": "+91 98765 43210", "email": "orders@grainmasters.com", "status": "Active", "suppliedItems": ["Rice", "Flour", "Grains"]},
    {"name": "Fresh Fields", "contact": "+91 98765 12345", "email": "sales@freshfields.com", "status": "Active", "suppliedItems": ["Vegetables", "Produce", "Herbs"]},
    {"name": "Global Imports", "contact": "+91 99887 76655", "email": "imports@global.com", "status": "Active", "suppliedItems": ["Oils", "Exotic Spices", "Saffron"]},
    {"name": "Dairy Best", "contact": "+91 91234 56789", "email": "supply@dairybest.com", "status": "Active", "suppliedItems": ["Cheese", "Milk", "Butter"]},
    {"name": "Poultry Plus", "contact": "+91 88990 01122", "email": "orders@poultryplus.com", "status": "Active", "suppliedItems": ["Chicken", "Eggs"]},
]

SAMPLE_MENU_ITEMS = [
    {"name": "Chicken Biryani", "category": "Main Course", "price": 320, "description": "Aromatic basmati rice with tender chicken and spices", "dietType": "non-veg", "available": True},
    {"name": "Margherita Pizza", "category": "Pizza", "price": 280, "description": "Classic pizza with fresh tomatoes, mozzarella and basil", "dietType": "veg", "available": True},
    {"name": "Greek Salad", "category": "Salads", "price": 180, "description": "Fresh cucumber, tomatoes, olives with olive oil dressing", "dietType": "veg", "available": True},
    {"name": "Butter Chicken", "category": "Main Course", "price": 340, "description": "Creamy tomato-based curry with tender chicken pieces", "dietType": "non-veg", "available": True},
    {"name": "Paneer Tikka", "category": "Starters", "price": 220, "description": "Grilled cottage cheese marinated in spices", "dietType": "veg", "available": True},
    {"name": "French Fries", "category": "Sides", "price": 120, "description": "Crispy golden potato fries", "dietType": "veg", "available": True},
]


async def seed_database():
    """Seed the database with sample data"""
    uri = os.getenv('MONGODB_URI')
    if not uri:
        print("ERROR: MONGODB_URI not set in environment")
        return
    
    client = AsyncIOMotorClient(uri)
    db = client.get_default_database() or client['rms']
    
    print("Starting database seed...")
    
    # Seed Staff Accounts
    print("\n[STAFF] Seeding staff accounts...")
    for staff in SAMPLE_STAFF:
        existing = await db.staff.find_one({"email": staff["email"].lower()})
        if existing:
            print(f"  ↳ Skipping {staff['name']} (exists)")
        else:
            staff_doc = {
                "name": staff["name"],
                "email": staff["email"].lower(),
                "phone": staff["phone"],
                "role": staff["role"],
                "password_hash": pbkdf2_sha256.hash(staff["password"]),
                "active": True,
                "createdAt": datetime.utcnow(),
            }
            await db.staff.insert_one(staff_doc)
            print(f"  ✓ Created {staff['name']} ({staff['role']})")
    
    # Seed Ingredients
    print("\n[PKG] Seeding ingredients...")
    ingredient_ids = {}
    for ing in SAMPLE_INGREDIENTS:
        existing = await db.ingredients.find_one({"name": ing["name"]})
        if existing:
            print(f"  ↳ Skipping {ing['name']} (exists)")
            ingredient_ids[ing["name"]] = str(existing["_id"])
        else:
            ing["createdAt"] = datetime.utcnow()
            result = await db.ingredients.insert_one(ing)
            ingredient_ids[ing["name"]] = str(result.inserted_id)
            print(f"  ✓ Created {ing['name']}")
    
    # Seed Suppliers
    print("\n[SUPPLY] Seeding suppliers...")
    for sup in SAMPLE_SUPPLIERS:
        existing = await db.suppliers.find_one({"name": sup["name"]})
        if existing:
            print(f"  ↳ Skipping {sup['name']} (exists)")
        else:
            sup["createdAt"] = datetime.utcnow()
            await db.suppliers.insert_one(sup)
            print(f"  ✓ Created {sup['name']}")
    
    # Seed Menu Items
    print("\n[MENU] Seeding menu items...")
    menu_ids = {}
    for item in SAMPLE_MENU_ITEMS:
        existing = await db.menu_items.find_one({"name": item["name"]})
        if existing:
            print(f"  ↳ Skipping {item['name']} (exists)")
            menu_ids[item["name"]] = str(existing["_id"])
        else:
            item["createdAt"] = datetime.utcnow()
            item["updatedAt"] = datetime.utcnow()
            result = await db.menu_items.insert_one(item)
            menu_ids[item["name"]] = str(result.inserted_id)
            print(f"  ✓ Created {item['name']}")
    
    # Seed Recipes (ingredient mappings)
    print("\n[INFO] Seeding recipes...")
    recipes = [
        {
            "menuItemId": menu_ids.get("Chicken Biryani"),
            "menuItemName": "Chicken Biryani",
            "ingredients": [
                {"ingredientId": ingredient_ids.get("Basmati Rice"), "name": "Basmati Rice", "amount": 0.2, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Chicken Breast"), "name": "Chicken Breast", "amount": 0.25, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Onions"), "name": "Onions", "amount": 0.1, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Saffron"), "name": "Saffron", "amount": 0.001, "unit": "kg"},
            ]
        },
        {
            "menuItemId": menu_ids.get("Margherita Pizza"),
            "menuItemName": "Margherita Pizza",
            "ingredients": [
                {"ingredientId": ingredient_ids.get("Mozzarella Cheese"), "name": "Mozzarella Cheese", "amount": 0.15, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Tomatoes"), "name": "Tomatoes", "amount": 0.1, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Olive Oil"), "name": "Olive Oil", "amount": 0.02, "unit": "L"},
                {"ingredientId": ingredient_ids.get("Fresh Basil"), "name": "Fresh Basil", "amount": 0.01, "unit": "kg"},
            ]
        },
        {
            "menuItemId": menu_ids.get("Greek Salad"),
            "menuItemName": "Greek Salad",
            "ingredients": [
                {"ingredientId": ingredient_ids.get("Tomatoes"), "name": "Tomatoes", "amount": 0.2, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Olive Oil"), "name": "Olive Oil", "amount": 0.05, "unit": "L"},
                {"ingredientId": ingredient_ids.get("Onions"), "name": "Onions", "amount": 0.05, "unit": "kg"},
            ]
        },
        {
            "menuItemId": menu_ids.get("Butter Chicken"),
            "menuItemName": "Butter Chicken",
            "ingredients": [
                {"ingredientId": ingredient_ids.get("Chicken Breast"), "name": "Chicken Breast", "amount": 0.25, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Tomatoes"), "name": "Tomatoes", "amount": 0.15, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Onions"), "name": "Onions", "amount": 0.1, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Garlic"), "name": "Garlic", "amount": 0.02, "unit": "kg"},
            ]
        },
        {
            "menuItemId": menu_ids.get("French Fries"),
            "menuItemName": "French Fries",
            "ingredients": [
                {"ingredientId": ingredient_ids.get("Potatoes"), "name": "Potatoes", "amount": 0.3, "unit": "kg"},
                {"ingredientId": ingredient_ids.get("Olive Oil"), "name": "Olive Oil", "amount": 0.05, "unit": "L"},
            ]
        },
    ]
    
    for recipe in recipes:
        if not recipe["menuItemId"]:
            print(f"  [WARN] Skipping {recipe['menuItemName']} (missing menu item)")
            continue
            
        existing = await db.recipes.find_one({"menuItemId": recipe["menuItemId"]})
        if existing:
            print(f"  ↳ Skipping {recipe['menuItemName']} recipe (exists)")
        else:
            recipe["createdAt"] = datetime.utcnow()
            await db.recipes.insert_one(recipe)
            print(f"  ✓ Created {recipe['menuItemName']} recipe")
    
    print("\n[OK] Database seeding complete!")
    print(f"   Ingredients: {len(ingredient_ids)}")
    print(f"   Menu Items: {len(menu_ids)}")
    print(f"   Recipes: {len(recipes)}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
