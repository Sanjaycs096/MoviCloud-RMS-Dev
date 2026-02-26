from motor.motor_asyncio import AsyncIOMotorClient
import os
from urllib.parse import quote_plus

_client = None
db = None

def init_db(uri: str = None):
    global _client, db
    if _client is not None:
        return db
    if uri is None:
        uri = os.getenv('MONGODB_URI')
    if not uri:
        print('[Admin Backend] ERROR: MONGODB_URI environment variable is not set!')
        print('[Admin Backend] Please set MONGODB_URI in Render dashboard or .env file')
        raise RuntimeError('MONGODB_URI must be set')
    
    # Log connection attempt (without exposing password)
    uri_safe = uri.split('@')[-1] if '@' in uri else uri
    print(f'[Admin Backend] Connecting to MongoDB: ...@{uri_safe}')
    
    try:
        _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5000)
        # Try to get database from URI, fallback to 'restaurant_db'
        default_db = _client.get_default_database()
        if default_db is not None:
            db = default_db
        else:
            db = _client['restaurant_db']
        print(f'[Admin Backend] MongoDB connected successfully to database: {db.name}')
        return db
    except Exception as e:
        print(f'[Admin Backend] MongoDB connection error: {e}')
        raise


def get_db():
    """Get the database instance"""
    global db
    if db is None:
        raise RuntimeError('Database not initialized. Call init_db() first.')
    return db
