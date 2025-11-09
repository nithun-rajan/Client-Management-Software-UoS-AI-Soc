"""Quick script to get organization IDs for registration"""
from app.core.database import SessionLocal
from app.models.organization import Organization

db = SessionLocal()

print("\n" + "="*60)
print("  AVAILABLE ORGANIZATIONS")
print("="*60)

orgs = db.query(Organization).all()

if orgs:
    for org in orgs:
        print(f"\nOrganization: {org.name}")
        print(f"  ID: {org.id}")
        print(f"  Created: {org.created_at}")
else:
    print("\n[WARNING] No organizations found!")
    print("Run 'python create_test_data.py' to create a test organization.")
    print("Or create one manually via database.")

print("\n" + "="*60)
print("\nTo register a user, use one of the organization IDs above.")
print("="*60 + "\n")

db.close()

