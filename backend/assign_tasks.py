"""Assign tasks to agents"""
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.user import User


def assign_tasks_to_agents(db: Session, tasks: list, agents: list):
    """Assign tasks to agents (assigned_to - using agent name)"""
    print(f"\n[*] Assigning tasks to agents...")
    unassigned_tasks = [t for t in tasks if not t.assigned_to]
    for i, task in enumerate(unassigned_tasks):
        agent = agents[i % len(agents)]
        agent_name = f"{agent.first_name} {agent.last_name}"
        task.assigned_to = agent_name
    db.commit()
    print(f"[OK] Assigned {len(unassigned_tasks)} tasks to agents")

