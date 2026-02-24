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
        raise RuntimeError('MONGODB_URI must be set')
    _client = AsyncIOMotorClient(uri)
    # Try to get database from URI, fallback to 'restaurant_db'
    default_db = _client.get_default_database()
    if default_db is not None:
        db = default_db
    else:
        db = _client['restaurant_db']
    return db


def get_db():
    """Get the database instance"""
    global db
    if db is None:
        raise RuntimeError('Database not initialized. Call init_db() first.')
    return db
