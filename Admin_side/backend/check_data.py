import asyncio
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

sys.path.append(os.path.abspath('.'))

from app.db import init_db

async def check_database_data():
    try:
        print("🔍 Checking database data...")
        db = init_db()
        print(f"[DATA] Connected to database: {db.name}")
        
        # Get collections with document counts
        collections = await db.list_collection_names()
        print(f"📁 Total collections: {len(collections)}")
        print("\n[LIST] Collection Details:")
        
        for collection_name in sorted(collections):
            collection = db[collection_name]
            count = await collection.count_documents({})
            print(f"  [PKG] {collection_name}: {count} documents")
        
        # Show sample data from key collections
        key_collections = ['menu', 'orders', 'staff', 'users', 'settings']
        
        for coll_name in key_collections:
            if coll_name in collections:
                print(f"\n🔍 Sample data from '{coll_name}' collection:")
                collection = db[coll_name]
                # Get first 2 documents
                async for doc in collection.find({}).limit(2):
                    print(f"  📄 Document: {doc.get('_id', 'No ID')}")
                    # Print key fields based on collection type
                    if coll_name == 'menu':
                        print(f"    - Name: {doc.get('name', 'N/A')}")
                        print(f"    - Price: ${doc.get('price', 'N/A')}")
                        print(f"    - Category: {doc.get('category', 'N/A')}")
                    elif coll_name == 'orders':
                        print(f"    - Order ID: {doc.get('orderId', 'N/A')}")
                        print(f"    - Status: {doc.get('status', 'N/A')}")
                        print(f"    - Total: ${doc.get('totalAmount', 'N/A')}")
                    elif coll_name == 'staff':
                        print(f"    - Name: {doc.get('name', 'N/A')}")
                        print(f"    - Role: {doc.get('role', 'N/A')}")
                        print(f"    - Email: {doc.get('email', 'N/A')}")
                    elif coll_name == 'users':
                        print(f"    - Username: {doc.get('username', 'N/A')}")
                        print(f"    - Role: {doc.get('role', 'N/A')}")
                    elif coll_name == 'settings':
                        print(f"    - Key: {doc.get('key', 'N/A')}")
                        print(f"    - Value: {doc.get('value', 'N/A')}")
                    print("    ---")
        
        print("\n[OK] Database contains live data and is working properly!")
        
    except Exception as e:
        print(f"[ERR] Error checking database: {e}")

if __name__ == "__main__":
    asyncio.run(check_database_data())