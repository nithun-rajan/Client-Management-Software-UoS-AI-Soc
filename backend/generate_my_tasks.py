#!/usr/bin/env python3
"""
Script to generate tasks assigned to the current user (by email).
Run with: python generate_my_tasks.py <user_email> [count]
"""

import sys
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.enums import TaskStatus

def generate_my_tasks(user_email: str, count: int = 10):
    """Generate tasks assigned to a specific user"""
    db = SessionLocal()
    
    try:
        # Get the user
        user = db.query(User).filter(User.email == user_email).first()
        if not user:
            print(f"[ERROR] User with email {user_email} not found")
            return
        
        user_full_name = f"{user.first_name} {user.last_name}"
        print(f"[*] Found user: {user_full_name} ({user.email})")
        print(f"    User ID: {user.id}")
        
        # Task templates
        task_templates = [
            {"title": "Follow up on viewing feedback", "priority": "urgent", "status": TaskStatus.TODO},
            {"title": "Complete AML verification", "priority": "urgent", "status": TaskStatus.IN_PROGRESS},
            {"title": "Send contract to client", "priority": "urgent", "status": TaskStatus.TODO},
            {"title": "Schedule property inspection", "priority": "high", "status": TaskStatus.TODO},
            {"title": "Process deposit payment", "priority": "urgent", "status": TaskStatus.IN_PROGRESS},
            {"title": "Update property listing photos", "priority": "medium", "status": TaskStatus.TODO},
            {"title": "Review tenant application", "priority": "medium", "status": TaskStatus.IN_PROGRESS},
            {"title": "Prepare viewing schedule", "priority": "medium", "status": TaskStatus.TODO},
            {"title": "Contact landlord about maintenance", "priority": "medium", "status": TaskStatus.TODO},
            {"title": "Update CRM records", "priority": "medium", "status": TaskStatus.COMPLETED},
            {"title": "Send welcome email to new tenant", "priority": "medium", "status": TaskStatus.TODO},
            {"title": "Schedule property viewing", "priority": "medium", "status": TaskStatus.IN_PROGRESS},
            {"title": "Review offer details", "priority": "medium", "status": TaskStatus.TODO},
            {"title": "Prepare tenancy agreement", "priority": "medium", "status": TaskStatus.IN_PROGRESS},
            {"title": "Conduct tenant reference check", "priority": "high", "status": TaskStatus.IN_PROGRESS},
            {"title": "Process tenant application", "priority": "high", "status": TaskStatus.TODO},
            {"title": "Schedule move-in inspection", "priority": "medium", "status": TaskStatus.TODO},
            {"title": "Verify vendor AML documents", "priority": "high", "status": TaskStatus.TODO},
            {"title": "Schedule property valuation", "priority": "high", "status": TaskStatus.IN_PROGRESS},
            {"title": "Prepare sales instruction contract", "priority": "medium", "status": TaskStatus.TODO},
        ]
        
        priorities = ["low", "medium", "high", "urgent"]
        statuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED]
        
        tasks = []
        print(f"\n[*] Generating {count} tasks for {user_full_name}...")
        
        for i in range(count):
            # Pick a random template or create a custom one
            if i < len(task_templates):
                template = task_templates[i]
            else:
                action_verbs = ["Review", "Process", "Schedule", "Update", "Contact", "Prepare", "Send", "Follow up on"]
                nouns = ["application", "contract", "viewing", "payment", "inspection", "documentation", "inquiry", "feedback"]
                template = {
                    "title": f"{random.choice(action_verbs)} {random.choice(nouns)}",
                    "priority": random.choice(priorities),
                    "status": random.choice(statuses)
                }
            
            # Generate due date (mix of past, today, and future)
            days_offset = random.choice([
                -2, -1,  # Past dates
                0,  # Today
                1, 2, 3, 5, 7, 10  # Future dates
            ])
            due_date = datetime.now() + timedelta(days=days_offset)
            due_date = due_date.replace(hour=17, minute=0, second=0, microsecond=0)
            
            # Add description sometimes
            description = None
            if random.random() < 0.4:
                descriptions = [
                    "Please ensure all documentation is complete before proceeding.",
                    "Follow up within 24 hours if no response.",
                    "Priority task - needs attention today.",
                    "Standard procedure - no rush.",
                    "Client has requested urgent action on this matter.",
                    "Part of ongoing property management workflow.",
                ]
                description = random.choice(descriptions)
            
            task = Task(
                title=template["title"],
                description=description,
                status=template["status"],
                priority=template["priority"],
                due_date=due_date if random.random() < 0.9 else None,  # 90% have due dates
                assigned_to=user_full_name,  # Assign to user's full name
            )
            
            db.add(task)
            tasks.append(task)
            print(f"   Created task: {task.title} (due: {task.due_date.strftime('%Y-%m-%d') if task.due_date else 'No due date'})")
        
        db.commit()
        print(f"\n[OK] Created {len(tasks)} tasks assigned to {user_full_name}")
        return tasks
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to generate tasks: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_my_tasks.py <user_email> [count]")
        print("Example: python generate_my_tasks.py john.smith@uos-crm.co.uk 10")
        sys.exit(1)
    
    user_email = sys.argv[1]
    count = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    
    generate_my_tasks(user_email, count)

