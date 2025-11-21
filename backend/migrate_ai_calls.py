"""
Migration Script: Add AI Calls Table

This script adds the ai_calls table to the existing database without affecting other tables.
Safe to run on existing databases with data.
"""

from app.core.database import Base, engine
from app.models.ai_call import AICall  # Import the new model
import app.models  # Import all models to ensure they're registered

def migrate_ai_calls():
    """Add ai_calls table to existing database"""
    print("Running migration: Add AI Calls table...")
    
    try:
        # Create only the ai_calls table
        # This won't affect existing tables
        AICall.__table__.create(bind=engine, checkfirst=True)
        print("[OK] Successfully created ai_calls table")
        print("[INFO] The ai_calls table is now ready to use")
        
    except Exception as e:
        if "already exists" in str(e).lower():
            print("[INFO] ai_calls table already exists - no migration needed")
        else:
            print(f"[ERROR] Migration failed: {str(e)}")
            raise

if __name__ == "__main__":
    migrate_ai_calls()

