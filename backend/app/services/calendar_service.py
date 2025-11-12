"""
Calendar Service for Auto-Scheduling Property Viewings

Implements automated viewing scheduling based on blueprint requirements:
- Page 21: "viewings being booked in automatically based on negotiators availability"
- Page 24: "Viewing scheduling from applicant record"
- Page 54: "viewings being booked in automatically based on negotiators availability"
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, time, date
from sqlalchemy.orm import Session
from app.models.calendar import AgentAvailability, PropertyViewingSlot, ViewingScheduleRule
from app.models.viewing import Viewing
from app.models.property import Property
from app.models.applicant import Applicant


class CalendarService:
    """
    Service for automated viewing scheduling and calendar management
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    async def auto_schedule_viewing(self, applicant_id: str, property_id: str, 
                                  preferred_times: List[Dict] = None) -> Dict[str, Any]:
        """
        Automatically schedule a viewing based on availability
        Blueprint page 21: Auto-booking based on negotiator availability
        """
        try:
            # Get applicant preferences
            applicant = self.db.query(Applicant).filter(Applicant.id == applicant_id).first()
            if not applicant:
                return {"success": False, "error": "Applicant not found"}
            
            # Get property and its scheduling rules
            property_obj = self.db.query(Property).filter(Property.id == property_id).first()
            if not property_obj:
                return {"success": False, "error": "Property not found"}
            
            # Find available slots
            available_slots = await self.find_available_slots(
                property_id, 
                applicant.preferred_viewing_times if hasattr(applicant, 'preferred_viewing_times') else None,
                preferred_times
            )
            
            if not available_slots:
                return {"success": False, "error": "No available viewing slots found"}
            
            # Select the best slot (earliest available that matches preferences)
            best_slot = self._select_best_slot(available_slots, applicant)
            
            # Create viewing appointment
            viewing = Viewing(
                property_id=property_id,
                applicant_id=applicant_id,
                scheduled_date=best_slot['datetime'],
                duration_minutes="30",
                status="scheduled",
                assigned_agent=best_slot.get('agent_id')
            )
            
            self.db.add(viewing)
            self.db.commit()
            self.db.refresh(viewing)
            
            # Send automatic confirmations if enabled
            if await self._should_auto_confirm(property_id):
                await self._send_auto_confirmation(viewing)
            
            return {
                "success": True,
                "viewing": viewing,
                "slot_selected": best_slot,
                "auto_confirmed": await self._should_auto_confirm(property_id)
            }
            
        except Exception as e:
            self.db.rollback()
            return {"success": False, "error": f"Auto-scheduling failed: {str(e)}"}
    
    async def find_available_slots(self, property_id: str, 
                                 applicant_preferences: List[Dict] = None,
                                 preferred_times: List[Dict] = None) -> List[Dict[str, Any]]:
        """
        Find available viewing slots for a property
        Blueprint page 24: "Viewing availability times"
        """
        available_slots = []
        
        # Get property scheduling rules
        rules = self.db.query(ViewingScheduleRule).filter(
            (ViewingScheduleRule.property_id == property_id) | 
            (ViewingScheduleRule.property_id.is_(None))
        ).first()
        
        if not rules:
            rules = ViewingScheduleRule()  # Default rules
        
        # Calculate date range for search
        start_date = datetime.now() + timedelta(hours=rules.min_advance_hours)
        end_date = datetime.now() + timedelta(days=rules.max_advance_days)
        
        # Find available agents for this property
        available_agents = await self._get_available_agents(property_id, start_date, end_date)
        
        # Generate potential slots
        current_date = start_date.date()
        while current_date <= end_date.date():
            day_slots = await self._generate_day_slots(
                current_date, available_agents, property_id, rules
            )
            available_slots.extend(day_slots)
            current_date += timedelta(days=1)
        
        # Filter by applicant preferences if provided
        if applicant_preferences or preferred_times:
            available_slots = self._filter_by_preferences(
                available_slots, applicant_preferences or preferred_times
            )
        
        return available_slots
    
    async def _get_available_agents(self, property_id: str, start_date: datetime, end_date: datetime) -> List[Dict]:
        """Get agents available for viewings in the date range"""
        # This would integrate with your user/agent management system
        # For now, return mock data
        return [
            {
                "agent_id": "agent_1",
                "name": "John Smith",
                "availability": self._get_agent_availability("agent_1", start_date, end_date)
            }
        ]
    
    async def _generate_day_slots(self, slot_date: date, available_agents: List[Dict], 
                                property_id: str, rules: ViewingScheduleRule) -> List[Dict]:
        """Generate available slots for a specific day"""
        slots = []
        
        for agent in available_agents:
            agent_availability = agent['availability'].get(slot_date, [])
            
            for availability in agent_availability:
                # Generate 30-minute slots within available time window
                current_time = availability['start_time']
                while current_time <= availability['end_time']:
                    slot_datetime = datetime.combine(slot_date, current_time)
                    
                    # Check if slot is available (no conflicts)
                    if await self._is_slot_available(property_id, agent['agent_id'], slot_datetime):
                        slots.append({
                            "datetime": slot_datetime,
                            "agent_id": agent['agent_id'],
                            "agent_name": agent['name'],
                            "duration_minutes": rules.slot_duration_minutes,
                            "property_id": property_id
                        })
                    
                    current_time = (datetime.combine(date.today(), current_time) + 
                                  timedelta(minutes=rules.slot_duration_minutes + rules.buffer_between_viewings)).time()
        
        return slots
    
    async def _is_slot_available(self, property_id: str, agent_id: str, slot_datetime: datetime) -> bool:
        """Check if a time slot is available (no existing viewings)"""
        # Check for property conflicts
        property_conflict = self.db.query(Viewing).filter(
            Viewing.property_id == property_id,
            Viewing.scheduled_date == slot_datetime,
            Viewing.status.in_(["scheduled", "confirmed"])
        ).first()
        
        if property_conflict:
            return False
        
        # Check for agent conflicts
        agent_conflict = self.db.query(Viewing).filter(
            Viewing.assigned_agent == agent_id,
            Viewing.scheduled_date == slot_datetime,
            Viewing.status.in_(["scheduled", "confirmed"])
        ).first()
        
        if agent_conflict:
            return False
        
        return True
    
    def _select_best_slot(self, available_slots: List[Dict], applicant: Applicant) -> Dict:
        """Select the best available slot based on preferences and availability"""
        if not available_slots:
            return None
        
        # Sort by datetime (earliest first)
        available_slots.sort(key=lambda x: x['datetime'])
        
        # For now, return the earliest available slot
        # In a real implementation, this would consider:
        # - Applicant's stated preferences
        # - Agent experience with similar properties
        # - Geographic proximity
        # - Historical success rates
        
        return available_slots[0]
    
    async def _should_auto_confirm(self, property_id: str) -> bool:
        """Check if viewings should be auto-confirmed for this property"""
        rules = self.db.query(ViewingScheduleRule).filter(
            ViewingScheduleRule.property_id == property_id
        ).first()
        
        return rules.auto_confirm_viewings if rules else False
    
    async def _send_auto_confirmation(self, viewing: Viewing):
        """Send automatic confirmation for scheduled viewing"""
        # This would integrate with your messaging service
        # For now, just update the viewing record
        viewing.confirmation_sent = True
        viewing.status = "confirmed"
        self.db.commit()
    
    def _get_agent_availability(self, agent_id: str, start_date: datetime, end_date: datetime) -> Dict:
        """Get agent availability for date range (mock implementation)"""
        # This would query the AgentAvailability model
        # For now, return mock availability
        availability = {}
        current_date = start_date.date()
        
        while current_date <= end_date.date():
            # Mock: Agents available 9 AM - 5 PM on weekdays
            if current_date.weekday() < 5:  # Monday-Friday
                availability[current_date] = [
                    {"start_time": time(9, 0), "end_time": time(12, 0)},
                    {"start_time": time(13, 0), "end_time": time(17, 0)}
                ]
            current_date += timedelta(days=1)
        
        return availability
    
    def _filter_by_preferences(self, slots: List[Dict], preferences: List[Dict]) -> List[Dict]:
        """Filter slots based on applicant preferences"""
        if not preferences:
            return slots
        
        filtered_slots = []
        for slot in slots:
            slot_time = slot['datetime'].time()
            slot_weekday = slot['datetime'].weekday()
            
            for preference in preferences:
                if self._matches_preference(slot_time, slot_weekday, preference):
                    filtered_slots.append(slot)
                    break
        
        return filtered_slots
    
    def _matches_preference(self, slot_time: time, slot_weekday: int, preference: Dict) -> bool:
        """Check if a slot matches applicant preferences"""
        # Simple matching logic - can be enhanced
        preferred_days = preference.get('days', [])
        preferred_times = preference.get('times', [])
        
        day_match = not preferred_days or slot_weekday in preferred_days
        time_match = not preferred_times or any(
            start <= slot_time <= end for start, end in preferred_times
        )
        
        return day_match and time_match


# Service instance management
_calendar_service = None

def get_calendar_service(db: Session) -> CalendarService:
    """Get calendar service instance"""
    global _calendar_service
    if _calendar_service is None:
        _calendar_service = CalendarService(db)
    return _calendar_service