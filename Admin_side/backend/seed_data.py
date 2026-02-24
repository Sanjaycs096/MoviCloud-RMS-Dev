"""
Seed required data (roles, admin staff) into MongoDB for offers module
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

async def seed():
    uri = os.getenv('MONGODB_URI')
    if not uri:
        print("ERROR: MONGODB_URI not set in .env")
        return
    
    print(f"Connecting to: {uri[:50]}...")
    client = AsyncIOMotorClient(uri)
    
    # Get database name from URI or use default
    db = client.get_default_database()
    if db is None:
        db = client['restaurant_db']
    
    print(f"Using database: {db.name}")
    
    # Seed roles
    roles = [
        {
            '_id': 'admin',
            'name': 'Admin',
            'description': 'Full system access with all permissions',
            'permissions': {
                'dashboard': True, 'menu': True, 'orders': True, 'kitchen': True,
                'tables': True, 'inventory': True, 'staff': True, 'billing': True,
                'offers': True, 'reports': True, 'notifications': True,
                'settings': True
            },
            'createdAt': datetime.utcnow().isoformat()
        },
        {
            '_id': 'manager',
            'name': 'Manager',
            'description': 'Restaurant operations management',
            'permissions': {
                'dashboard': True, 'menu': True, 'orders': True, 'kitchen': True,
                'tables': True, 'inventory': True, 'staff': True, 'billing': True,
                'offers': True, 'reports': True, 'notifications': True,
                'settings': False
            },
            'createdAt': datetime.utcnow().isoformat()
        },
        {
            '_id': 'chef',
            'name': 'Chef',
            'description': 'Kitchen and menu management',
            'permissions': {
                'dashboard': True, 'menu': True, 'orders': True, 'kitchen': True,
                'tables': False, 'inventory': True, 'staff': False, 'billing': False,
                'offers': False, 'reports': False, 'notifications': True,
                'settings': False
            },
            'createdAt': datetime.utcnow().isoformat()
        },
        {
            '_id': 'waiter',
            'name': 'Waiter',
            'description': 'Order and table management',
            'permissions': {
                'dashboard': True, 'menu': True, 'orders': True, 'kitchen': False,
                'tables': True, 'inventory': False, 'staff': False, 'billing': True,
                'offers': False, 'reports': False, 'notifications': True,
                'settings': False
            },
            'createdAt': datetime.utcnow().isoformat()
        },
        {
            '_id': 'cashier',
            'name': 'Cashier',
            'description': 'Billing and payment management',
            'permissions': {
                'dashboard': True, 'menu': True, 'orders': True, 'kitchen': False,
                'tables': False, 'inventory': False, 'staff': False, 'billing': True,
                'offers': True, 'reports': True, 'notifications': True,
                'settings': False
            },
            'createdAt': datetime.utcnow().isoformat()
        },
    ]
    
    print("\n=== SEEDING ROLES ===")
    for role in roles:
        result = await db.roles.update_one(
            {'_id': role['_id']},
            {'$set': role},
            upsert=True
        )
        status = "updated" if result.modified_count else "created/exists"
        print(f"  {role['_id']}: {status}")
    
    # Check for existing admin staff or create one
    print("\n=== CHECKING ADMIN STAFF ===")
    admin = await db.staff.find_one({'role': 'admin'})
    
    if admin:
        print(f"  Admin exists: {admin['_id']} - {admin.get('name', 'N/A')}")
        admin_id = str(admin['_id'])
    else:
        result = await db.staff.insert_one({
            'name': 'Test Admin',
            'email': 'admin@example.com',
            'role': 'admin',
            'active': True,
            'createdAt': datetime.utcnow().isoformat()
        })
        admin_id = str(result.inserted_id)
        print(f"  Created admin: {admin_id}")
    
    # Show all staff
    print("\n=== ALL STAFF ===")
    async for s in db.staff.find():
        print(f"  {s['_id']} | {s.get('name', 'N/A')} | role: {s.get('role', 'N/A')}")
    
    print(f"\n=== DONE ===")
    print(f"Use this admin ID in frontend localStorage:")
    print(f"  {admin_id}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())
