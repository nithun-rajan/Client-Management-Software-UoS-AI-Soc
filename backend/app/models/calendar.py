from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, Integer, JSON, Time, Date
from sqlalchemy.orm import relationship
from datetime import datetime, time, date
from app.models.base import BaseModel


class AgentAvailability(BaseModel):
    """
    Agent availability schedule for auto-booking viewings
    Blueprint page 21: "viewings being booked in automatically based on negotiators availability"
    """
    __tablename__ = "agent_availability"
    
    agent_id = Column(String, ForeignKey('users.id'), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0-6 (Monday-Sunday)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True)
    
    # Recurring pattern
    recurrence_type = Column(String, default="weekly")  # weekly, biweekly, monthly
    valid_from = Column(Date, nullable=False)
    valid_to = Column(Date, nullable=True)  # None for ongoing availability
    
    # Relationships
    agent = relationship("User", backref="availability_slots")


class PropertyViewingSlot(BaseModel):
    """
    Pre-defined viewing slots for properties
    Blueprint page 11: "Viewing availability slots (calendar integration)"
    """
    __tablename__ = "property_viewing_slots"
    
    property_id = Column(String, ForeignKey('properties.id'), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    max_bookings = Column(Integer, default=1)  # How many viewings can be booked in this slot
    current_bookings = Column(Integer, default=0)
    is_available = Column(Boolean, default=True)
    
    # Relationships
    property = relationship("Property", backref="viewing_slots")


class ViewingScheduleRule(BaseModel):
    """
    Rules for auto-scheduling viewings
    """
    __tablename__ = "viewing_schedule_rules"
    
    property_id = Column(String, ForeignKey('properties.id'), nullable=True)  # Null for global rules
    agent_id = Column(String, ForeignKey('users.id'), nullable=True)  # Null for property-specific rules
    
    # Scheduling constraints
    min_advance_hours = Column(Integer, default=24)  # Minimum notice required
    max_advance_days = Column(Integer, default=14)   # How far in advance to book
    slot_duration_minutes = Column(Integer, default=30)
    buffer_between_viewings = Column(Integer, default=15)  # Minutes between viewings
    
    # Auto-booking preferences
    auto_confirm_viewings = Column(Boolean, default=False)
    require_agent_approval = Column(Boolean, default=True)
    allow_tenant_self_service = Column(Boolean, default=False)
    
    # Notification preferences
    send_auto_reminders = Column(Boolean, default=True)
    reminder_hours_before = Column(Integer, default=24)
    
    # Relationships
    property = relationship("Property", backref="schedule_rules")
    agent = relationship("User", backref="schedule_rules")


class ViewingConflict(BaseModel):
    """
    Track and resolve viewing scheduling conflicts
    """
    __tablename__ = "viewing_conflicts"
    
    viewing_id = Column(String, ForeignKey('viewings.id'), nullable=False)
    conflict_type = Column(String, nullable=False)  # double_booking, agent_unavailable, property_unavailable
    conflicting_viewing_id = Column(String, ForeignKey('viewings.id'), nullable=True)
    resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)
    
    # Relationships
    viewing = relationship("Viewing", foreign_keys=[viewing_id], backref="conflicts")
    conflicting_viewing = relationship("Viewing", foreign_keys=[conflicting_viewing_id])