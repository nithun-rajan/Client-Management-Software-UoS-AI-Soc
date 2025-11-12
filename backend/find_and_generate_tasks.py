#!/usr/bin/env python3
"""
Script to find a user by name and generate tasks for them.
"""

from app.core.database import SessionLocal
from app.models.user import User
from generate_my_tasks import generate_my_tasks

def find_user_by_name(first_name: str, last_name: str):
    """Find user by name and generate tasks"""
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(
            User.first_name == first_name,
            User.last_name == last_name
        ).first()
        
        if not user:
            print(f"[ERROR] User '{first_name} {last_name}' not found")
            print("\nAvailable users:")
            all_users = db.query(User).all()
            for u in all_users:
                print(f"  - {u.first_name} {u.last_name} ({u.email})")
            return
        
        print(f"[*] Found user: {user.first_name} {user.last_name} ({user.email})")
        print(f"[*] Generating tasks...")
        
        # Generate tasks using the existing function
        generate_my_tasks(user.email, 15)
        
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3:
        first_name = sys.argv[1]
        last_name = sys.argv[2]
        find_user_by_name(first_name, last_name)
    else:
        print("Usage: python find_and_generate_tasks.py <first_name> <last_name>")
        print("Example: python find_and_generate_tasks.py John Agent")

