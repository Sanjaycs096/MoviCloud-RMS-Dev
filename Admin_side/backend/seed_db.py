#!/usr/bin/env python3
"""
MongoDB Seed Data Importer
Imports JSON seed files into MongoDB collections
"""

import json
import os
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient


def import_seed_data():
    """Import all JSON seed files into MongoDB"""
    
    # MongoDB connection
    mongo_uri = os.getenv('MONGODB_URI', 'mongodb+srv://priyadharshini:Ezhilithanya@cluster0.crvutrr.mongodb.net/restaurant_db')
    client = MongoClient(mongo_uri)
    db = client.get_default_database()
    
    # Seed data directory
    seed_dir = Path(__file__).parent / 'seeds'
    
    collections_data = {
        'riders': 'riders.json',
        'orders': 'orders.json',
        'menu': 'menu.json',
        'staff': 'staff.json',
        'ingredients': 'ingredients.json',
    }
    
    print("=" * 60)
    print("MongoDB Seed Data Import")
    print("=" * 60)
    print(f"Database: {db.name}")
    print(f"Seed directory: {seed_dir}")
    print()
    
    total_inserted = 0
    
    for collection_name, json_file in collections_data.items():
        json_path = seed_dir / json_file
        
        if not json_path.exists():
            print(f"[SKIP] {collection_name}: {json_file} not found")
            continue
        
        try:
            # Read JSON file
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if not isinstance(data, list):
                data = [data]
            
            # Add timestamps if not present
            for item in data:
                if 'createdAt' not in item:
                    item['createdAt'] = datetime.utcnow()
                if 'updatedAt' not in item:
                    item['updatedAt'] = datetime.utcnow()
            
            # Drop existing collection and insert fresh data
            collection = db[collection_name]
            collection.drop()
            
            # Insert data
            result = collection.insert_many(data)
            inserted_count = len(result.inserted_ids)
            total_inserted += inserted_count
            
            print(f"[OK] {collection_name}")
            print(f"     - Inserted {inserted_count} documents")
            print(f"     - File: {json_file}")
            print()
            
        except Exception as e:
            print(f"[ERROR] {collection_name}: {str(e)}")
            print()
    
    print("=" * 60)
    print(f"Import Complete: {total_inserted} total documents inserted")
    print("=" * 60)
    
    # Close connection
    client.close()


if __name__ == '__main__':
    import_seed_data()
