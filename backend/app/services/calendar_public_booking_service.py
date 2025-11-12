"""
Public Booking Service for Match-to-Viewing Automation

Implements the blueprint requirement: 
Pages 21, 28-29
"""

import secrets
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.match_history import MatchHistory
from app.models.viewing import Viewing
from app.models.applicant import Applicant
from app.models.property import Property
from app.services.calendar_service import CalendarService


class PublicBookingService:
    """
    Service for public viewing booking from match links
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.booking_token_length = 32
        self.booking_expiry_hours = 168  # 1 week
    
    async def generate_booking_link(self, match_id: str) -> Dict[str, Any]:
        """
        Generate a secure booking link for a property match
        Blueprint: "John could click a link to schedule that"
        """
        try:
            match = self.db.query(MatchHistory).filter(MatchHistory.id == match_id).first()
            if not match:
                return {"success": False, "error": "Match not found"}
            
            # Generate secure token
            booking_token = secrets.token_urlsafe(self.booking_token_length)
            
            # Update match with booking info
            match.booking_token = booking_token
            match.booking_url = f"/book-viewing/{booking_token}"
            
            self.db.commit()
            
            return {
                "success": True,
                "booking_url": match.booking_url,
                "booking_token": booking_token,
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=self.booking_expiry_hours)
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Booking link generation failed: {str(e)}"}
    
    async def book_viewing_from_match(self, booking_token: str, 
                                    preferred_times: List[Dict] = None) -> Dict[str, Any]:
        """
        Book a viewing from a match link click
        Blueprint: "An appointment would automatically be scheduled in the agents diary"
        """
        try:
            # Find match by booking token
            match = self.db.query(MatchHistory).filter(
                MatchHistory.booking_token == booking_token
            ).first()
            
            if not match:
                return {"success": False, "error": "Invalid booking link"}
            
            if match.viewing_booked:
                return {"success": False, "error": "Viewing already booked for this match"}
            
            # Use calendar service to auto-schedule viewing
            calendar_service = CalendarService(self.db)
            schedule_result = await calendar_service.auto_schedule_viewing(
                applicant_id=match.applicant_id,
                property_id=match.property_id,
                preferred_times=preferred_times,
                booking_context={
                    "source": "match_link",
                    "match_id": match.id,
                    "booking_token": booking_token,
                    "booking_url": match.booking_url
                }
            )
            
            if not schedule_result["success"]:
                return schedule_result
            
            # Link viewing to match
            viewing = schedule_result["viewing"]
            match.viewing_booked = True
            match.viewing_id = viewing.id
            match.viewing_date = viewing.scheduled_date
            match.booking_link_clicked_at = datetime.now(timezone.utc)
            
            self.db.commit()
            
            # Send confirmation (would integrate with messaging service)
            await self._send_booking_confirmation(viewing, match)
            
            return {
                "success": True,
                "viewing": viewing,
                "match": match,
                "auto_scheduled": True,
                "agent_assigned": viewing.assigned_agent is not None
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Booking failed: {str(e)}"}
    
    async def get_available_slots_for_match(self, booking_token: str) -> Dict[str, Any]:
        """
        Get available viewing slots for a specific match
        """
        try:
            match = self.db.query(MatchHistory).filter(
                MatchHistory.booking_token == booking_token
            ).first()
            
            if not match:
                return {"success": False, "error": "Invalid booking link"}
            
            calendar_service = CalendarService(self.db)
            available_slots = await calendar_service.find_available_slots(
                property_id=match.property_id,
                applicant_preferences=self._get_applicant_preferences(match.applicant)
            )
            
            return {
                "success": True,
                "available_slots": available_slots,
                "property": match.property,
                "applicant": match.applicant,
                "match": match
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get available slots: {str(e)}"}
    
    async def send_match_with_booking_link(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a property match with integrated booking link
        Blueprint: "A match gets sent to John Smith that says you'll like this property... want to book in a viewing"
        """
        try:
            # Create match record
            match = MatchHistory(
                property_id=match_data["property_id"],
                applicant_id=match_data["applicant_id"],
                match_score=match_data.get("match_score"),
                personalized_message=match_data.get("personalized_message"),
                match_reason=match_data.get("match_reason"),
                personalization_data=match_data.get("personalization_data"),
                send_method=match_data.get("send_method", "email"),
                recipient=match_data.get("recipient"),
                sent_by_agent=match_data.get("sent_by_agent"),
                sent_at=datetime.now(timezone.utc)
            )
            
            self.db.add(match)
            self.db.commit()
            self.db.refresh(match)
            
            # Generate booking link
            booking_result = await self.generate_booking_link(match.id)
            if not booking_result["success"]:
                return booking_result
            
            # Update match with final booking URL
            match.booking_url = booking_result["booking_url"]
            self.db.commit()
            
            # Send the match (integrate with messaging service)
            send_result = await self._send_match_message(match, booking_result["booking_url"])
            
            return {
                "success": True,
                "match": match,
                "booking_url": booking_result["booking_url"],
                "message_sent": send_result["success"]
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Failed to send match: {str(e)}"}
    
    def _get_applicant_preferences(self, applicant: Applicant) -> List[Dict]:
        """
        Extract viewing preferences from applicant record
        """
        preferences = []
        
        # Convert applicant availability to preference format
        if hasattr(applicant, 'viewing_availability') and applicant.viewing_availability:
            for availability in applicant.viewing_availability:
                preferences.append({
                    'days': [availability.get('day_of_week')],
                    'times': [
                        (availability.get('start_time'), availability.get('end_time'))
                    ]
                })
        
        return preferences
    
    async def _send_match_message(self, match: MatchHistory, booking_url: str) -> Dict[str, Any]:
        """
        Send the match message with booking link to applicant
        Blueprint page 29: Personalized match messages
        """
        # This would integrate with your existing messaging service
        # For now, return mock success
        
        property_address = match.property.address if match.property else "the property"
        personalization = match.personalization_data or {}
        
        message = f"""
Hi {match.applicant.first_name if match.applicant else 'there'},

I think you'll love {property_address}!

{match.match_reason or 'This property matches your search criteria perfectly.'}

Want to see it in person? Book a viewing at your convenience:
{booking_url}

Best regards,
The Property Team
"""
        
        # In real implementation, this would call your email/SMS service
        print(f"Sending match to {match.applicant.email if match.applicant else 'unknown'}: {message}")
        
        return {"success": True, "message": "Match sent successfully"}
    
    async def _send_booking_confirmation(self, viewing: Viewing, match: MatchHistory):
        """
        Send booking confirmation to applicant and agent
        """
        # This would integrate with your messaging service
        confirmation_message = f"""
Viewing Confirmed!

Property: {viewing.property.address if viewing.property else 'Unknown'}
Date: {viewing.scheduled_date.strftime('%A, %B %d at %I:%M %p')}
Agent: {viewing.assigned_agent or 'To be assigned'}

We look forward to showing you the property!
"""
        
        print(f"Booking confirmation: {confirmation_message}")
        return {"success": True}


# Service instance management
_public_booking_service = None

def get_public_booking_service(db: Session) -> PublicBookingService:
    """Get public booking service instance"""
    global _public_booking_service
    if _public_booking_service is None:
        _public_booking_service = PublicBookingService(db)
    return _public_booking_service