"""
Database Migration Script

This script adds new columns to existing tables without losing data.
Run this once after updating the model schema.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.core.database import Base, engine
import app.models  # Import all models to register them

def migrate_database():
    """Add new columns to existing tables"""
    print("🔄 Starting database migration...")
    
    with engine.connect() as conn:
        # Check if columns exist and add them if they don't
        migrations = [
            # Property table new columns
            ("properties", "epc_date", "DATE"),
            ("properties", "gas_safety_date", "DATE"),
            ("properties", "eicr_date", "DATE"),
            ("properties", "hmolicence_date", "DATE"),
            ("properties", "managed_by", "VARCHAR"),
            ("properties", "management_type", "VARCHAR"),
            ("properties", "complaints_count", "INTEGER DEFAULT 0"),
            ("properties", "active_complaints_count", "INTEGER DEFAULT 0"),
            ("properties", "last_complaint_date", "DATETIME"),
            
            # Tenancy table new columns
            ("tenancies", "tenant_name", "VARCHAR"),
            ("tenancies", "tenant_email", "VARCHAR"),
            ("tenancies", "tenant_phone", "VARCHAR"),
            ("tenancies", "tenant_id", "VARCHAR"),
            ("tenancies", "managed_by", "VARCHAR"),
        ]
        
        for table, column, column_type in migrations:
            try:
                # Check if column exists (SQLite doesn't have a direct way, so we'll try to add it)
                # SQLite will raise an error if column already exists, which we'll catch
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {column_type}"))
                conn.commit()
                print(f"✅ Added column {table}.{column}")
            except Exception as e:
                if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
                    print(f"⏭️  Column {table}.{column} already exists, skipping...")
                else:
                    print(f"⚠️  Error adding {table}.{column}: {e}")
        
        # Create maintenance_issues table if it doesn't exist
        try:
            Base.metadata.tables['maintenance_issues'].create(bind=engine, checkfirst=True)
            print("✅ Created maintenance_issues table")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("⏭️  maintenance_issues table already exists")
            else:
                print(f"⚠️  Error creating maintenance_issues table: {e}")
    
    print("✅ Migration complete!")

if __name__ == "__main__":
    migrate_database()

