from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task"""
    # Check if required fields are present
    if not task_data.title:
        raise HTTPException(status_code=400, detail="Title is required")
    
    db_task = Task(**task_data.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.get("/", response_model=list[TaskResponse])
def list_tasks(
    skip: int = Query(0, ge=0), 
    limit: int = Query(100, ge=1, le=1000), 
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all tasks with optional filtering"""
    query = db.query(Task)
    
    # Apply filters if provided
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    
    tasks = query.offset(skip).limit(limit).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    """Get a specific task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# additional endpoints :

# get by status
@router.get("/status/{status}", response_model=list[TaskResponse])
def get_tasks_by_status(status: str, db: Session = Depends(get_db)):
    """Get all tasks with a specific status"""
    tasks = db.query(Task).filter(Task.status == status).all()
    return tasks

# get by priority
@router.get("/priority/{priority}", response_model=list[TaskResponse])
def get_tasks_by_priority(priority: str, db: Session = Depends(get_db)):
    """Get all tasks with a specific priority"""
    tasks = db.query(Task).filter(Task.priority == priority).all()
    return tasks

#get by uid
@router.get("/assigned/{user_id}", response_model=list[TaskResponse])
def get_tasks_assigned_to_user(user_id: str, db: Session = Depends(get_db)):
    """Get all tasks assigned to a specific user"""
    tasks = db.query(Task).filter(Task.assigned_to == user_id).all()
    return tasks


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_data: TaskUpdate,
    db: Session = Depends(get_db)
):
    """Update a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()

