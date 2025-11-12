"""
Clear Property Photos Script

This script removes all property photos from the database by setting
main_photo_url and photo_urls to None for all properties.

WARNING: This will remove all photo URLs from all properties!
"""

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.property import Property

def clear_property_photos():
    """Clear all property photos from the database"""
    print("="*60)
    print("CLEARING PROPERTY PHOTOS")
    print("="*60)
    
    # Create database session
    db: Session = SessionLocal()
    
    try:
        # Get all properties
        properties = db.query(Property).all()
        print(f"[*] Found {len(properties)} properties")
        
        # Count properties with photos
        properties_with_main_photo = sum(1 for p in properties if p.main_photo_url)
        properties_with_photo_urls = sum(1 for p in properties if p.photo_urls)
        
        print(f"[*] Properties with main_photo_url: {properties_with_main_photo}")
        print(f"[*] Properties with photo_urls: {properties_with_photo_urls}")
        
        # Clear all photos
        updated_count = 0
        for property in properties:
            if property.main_photo_url or property.photo_urls:
                property.main_photo_url = None
                property.photo_urls = None
                updated_count += 1
        
        # Commit changes
        db.commit()
        
        print(f"[OK] Cleared photos from {updated_count} properties")
        print("[OK] All property photos have been removed from the database")
        
    except Exception as e:
        print(f"[ERROR] Failed to clear property photos: {e}")
        db.rollback()
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    clear_property_photos()

