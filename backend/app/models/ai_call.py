from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import BaseModel


class AICall(BaseModel):
    """
    Model for storing AI-powered phone call records.
    
    Used to track calls made via Ultravox + Twilio to qualify applicants.
    Stores call metadata, transcripts, summaries, and extracted information.
    """
    __tablename__ = "ai_calls"

    # Relationships
    applicant_id = Column(String, ForeignKey('applicants.id'), nullable=False, index=True)
    created_by_user_id = Column(String, ForeignKey('users.id'), nullable=False, index=True)
    
    # Call Details
    phone_number = Column(String, nullable=False)  # E.164 format (e.g., +14155552671)
    user_context = Column(Text, nullable=True)  # Additional instructions/context from agent
    
    # Status Tracking
    status = Column(
        String, 
        nullable=False, 
        default="pending",
        index=True
    )  # pending, in_progress, completed, failed, no_answer
    
    # Ultravox Integration
    ultravox_call_id = Column(String, nullable=True, unique=True, index=True)  # External call ID from Ultravox
    
    # Call Results
    duration_seconds = Column(Integer, nullable=True)  # Total call duration
    transcript = Column(Text, nullable=True)  # Full conversation transcript
    summary = Column(Text, nullable=True)  # AI-generated summary of the call
    extracted_data = Column(JSON, nullable=True)  # Structured data extracted from conversation
    recording_url = Column(String, nullable=True)  # URL to call recording (if available)
    
    # Error Handling
    error_message = Column(Text, nullable=True)  # Error details if call failed
    
    # Timestamps
    started_at = Column(DateTime, nullable=True)  # When call actually started (from Ultravox)
    completed_at = Column(DateTime, nullable=True)  # When call ended (from Ultravox)
    
    # Relationships
    applicant = relationship("Applicant", back_populates="ai_calls")
    created_by = relationship("User", foreign_keys=[created_by_user_id])

    def __repr__(self):
        return f"<AICall(id={self.id}, applicant_id={self.applicant_id}, status={self.status})>"

