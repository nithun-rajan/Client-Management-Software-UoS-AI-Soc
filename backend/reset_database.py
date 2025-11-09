"""
Reset Database Script

This script deletes the existing database and recreates it with the new schema.
WARNING: This will delete all existing data!

Use this in development when the schema has changed significantly.
"""

import os
from app.core.database import Base, engine
from app.core.config import settings
import app.models  # Import all models to register them

def reset_database():
    """Delete and recreate the database"""
    print("Resetting database...")
    
    # Get database file path
    db_url = settings.DATABASE_URL
    if db_url.startswith("sqlite:///./"):
        db_file = db_url.replace("sqlite:///./", "")
        db_path = os.path.join(os.path.dirname(__file__), db_file)
    else:
        print("ERROR: Only SQLite databases are supported for this script")
        return
    
    # Delete existing database file
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"[OK] Deleted existing database: {db_file}")
    else:
        print(f"[INFO] Database file doesn't exist: {db_file}")
    
    # Create all tables with new schema
    print("Creating tables with new schema...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database reset complete!")
    print("[INFO] Run 'python seed_data.py' to populate with test data")

if __name__ == "__main__":
    reset_database()

