from typing import Dict, List, Optional
from fastapi import HTTPException
from enum import Enum


class Domain(str, Enum):
    PROPERTY = "property"
    TENANCY = "tenancy"
    VENDOR = "vendor"
    APPLICANT = "applicant"


class WorkflowManager:
    """
    State machine for managing entity status transitions
    Based on CRM blueprint workflows
    """
    
    def __init__(self):
        # Define valid transitions for each domain
        self.transitions = {
            Domain.PROPERTY: {
                # Property status transitions - Blueprint pages 9, 13, 29-34
                "available": ["under_offer", "let_agreed", "withdrawn", "maintenance"],
                "under_offer": ["available", "let_agreed", "withdrawn"],
                "let_agreed": ["tenanted", "available"],  # Page 29: Let Agreed → Tenanted
                "tenanted": ["available", "managed"],     # Page 34: Tenancy started
                "managed": ["available"],
                "maintenance": ["available"],
                "withdrawn": ["available"]
            },
            Domain.TENANCY: {
                # Tenancy progression - Blueprint pages 29-34
                "draft": ["offer_accepted"],
                "offer_accepted": ["referencing", "draft"],  # Page 29: 1.2
                "referencing": ["referenced", "offer_accepted"],  # Page 30: 2.2
                "referenced": ["legal_docs"],  # Page 31: After referencing
                "legal_docs": ["ready_to_move_in"],  # Page 31: 3.1
                "ready_to_move_in": ["active"],  # Page 33: 5.1
                "active": ["expired", "terminated", "renewed"],  # Page 34
                "expired": ["draft"],
                "terminated": ["draft"],
                "renewed": ["active"]
            },
            Domain.VENDOR: {
                # Vendor sales progression - Blueprint pages 47-53
                "new": ["valuation_booked"],
                "valuation_booked": ["instructed", "lost"],
                "instructed": ["active", "withdrawn", "lost"],
                "active": ["sold", "withdrawn", "lost"],  # Property on market
                "sold": ["completed"],
                "completed": [],
                "withdrawn": ["new"],
                "lost": ["new"]
            },
            Domain.APPLICANT: {
                # Applicant lifecycle - Blueprint pages 21-27
                "new": ["qualified"],
                "qualified": ["viewing_booked", "archived"],
                "viewing_booked": ["offer_submitted", "qualified", "archived"],
                "offer_submitted": ["offer_accepted", "viewing_booked", "archived"],  # Page 29
                "offer_accepted": ["references", "viewing_booked"],  # Page 29: 1.2
                "references": ["let_agreed", "offer_accepted"],  # Page 30
                "let_agreed": ["tenancy_started", "references"],  # Page 29
                "tenancy_started": ["archived"],  # Page 33: 5.2
                "archived": ["new"]
            }
        }
        
        # Define side effects for transitions (automated actions)
        self.side_effects = {
            # Property transitions
            ("property", "available", "under_offer"): [
                "log_offer_received",  # Log that an offer has been received
                "create_activity_log",  # Create activity entry for tracking
                "notify_landlord"  # Notify landlord of offer
            ],
            ("property", "under_offer", "let_agreed"): [
                "update_portal_status",  # Page 29: 1.3 - Mark as let on Rightmove/Zoopla
                "collect_holding_deposit_property",  # Page 29: 1.4
                "send_offer_confirmation_property",  # Page 29: 1.5
            ],
            ("property", "let_agreed", "tenanted"): [
                "update_portal_status",  # Page 29: 1.3 - Mark as let on Rightmove/Zoopla
                "create_tenancy_record",  # Page 33: 5.2
                "assign_property_manager"  # Page 34: 5.3
            ],
            ("property", "tenanted", "available"): [
                "relist_on_portals",
                "schedule_review"
            ],
            
            # Tenancy transitions  
            ("tenancy", "offer_accepted", "referencing"): [
                "collect_holding_deposit",  # Page 29: 1.4
                "send_offer_confirmation",  # Page 29: 1.5
                "start_referencing_process"  # Page 30: 2.1
            ],
            ("tenancy", "referencing", "referenced"): [
                "store_reference_docs",  # Page 31: 2.4
                "conduct_right_to_rent_check"  # Page 31: 2.3
            ],
            ("tenancy", "legal_docs", "ready_to_move_in"): [
                "draft_tenancy_agreement",  # Page 31: 3.1
                "send_statutory_documents",  # Page 31: 3.2
                "collect_move_in_monies"  # Page 32: 3.3
            ],
            ("tenancy", "ready_to_move_in", "active"): [
                "register_security_deposit",  # Page 32: 3.4
                "sign_tenancy_agreement",  # Page 32: 3.5
                "execute_move_in"  # Page 33: 5.1
            ],
            
            # Applicant transitions
            ("applicant", "offer_submitted", "offer_accepted"): [
                "update_applicant_status",  # Page 29: 1.2
                "create_tenancy_progression"  # Page 29: Start progression workflow
            ],
            ("applicant", "let_agreed", "tenancy_started"): [
                "archive_applicant_record",  # Page 33: 5.2
                "create_active_tenancy"  # Page 33: 5.2
            ]
        }

    def get_valid_transitions(self, domain: Domain, current_status: str) -> List[str]:
        """Get all possible transitions from current status"""
        return self.transitions.get(domain, {}).get(current_status, [])
    
    def validate_transition(self, domain: Domain, current_status: str, new_status: str) -> bool:
        """Check if a transition is valid"""
        valid_transitions = self.get_valid_transitions(domain, current_status)
        return new_status in valid_transitions
    
    def get_side_effects(self, domain: Domain, current_status: str, new_status: str) -> List[str]:
        """Get automated actions for this transition"""
        return self.side_effects.get((domain.value, current_status, new_status), [])
    async def execute_side_effects(self, domain: Domain, entity_id: str, current_status: str, new_status: str, db):
        """Execute automated actions for this transition"""
        side_effects = self.get_side_effects(domain, current_status, new_status)
        
        for effect in side_effects:
            await getattr(self, f"execute_{effect}")(domain, entity_id, db)
    
    # Side effect implementations
    async def execute_update_portal_status(self, domain: Domain, entity_id: str, db):
        """Update property status on Rightmove/Zoopla - Page 29: 1.3"""
        # Implementation would integrate with portal APIs
        print(f"Updating portal status for {domain} {entity_id}")
    
    async def execute_create_tenancy_record(self, domain: Domain, entity_id: str, db):
        """Create tenancy record when property moves to tenanted - Page 33: 5.2"""
        print(f"Creating tenancy record for property {entity_id}")
    
    async def execute_collect_holding_deposit(self, domain: Domain, entity_id: str, db):
        """Collect holding deposit - Page 29: 1.4"""
        print(f"Collecting holding deposit for tenancy {entity_id}")
    
    async def execute_start_referencing_process(self, domain: Domain, entity_id: str, db):
        """Start referencing process - Page 30: 2.1"""
        print(f"Starting referencing process for tenancy {entity_id}")
    
    async def execute_assign_property_manager(self, domain: Domain, entity_id: str, db):
        """Assign property manager when property moves to tenanted - Page 34: 5.3"""
        if domain == Domain.PROPERTY:
            from app.models.property import Property
            property_obj = db.query(Property).filter(Property.id == entity_id).first()
            if property_obj:
                # TODO: Assign property manager from user context or default manager
                # For now, just log the action
                print(f"Assigning property manager for property {entity_id}")
                # property_obj.managed_by = user_id  # Set when auth is implemented
            else:
                print(f"Property {entity_id} not found for manager assignment")
        else:
            print(f"assign_property_manager only applies to properties, not {domain}")
    
    async def execute_collect_holding_deposit_property(self, domain: Domain, entity_id: str, db):
        """Collect holding deposit for property - Page 29: 1.4"""
        print(f"Collecting holding deposit for property {entity_id}")
    
    async def execute_send_offer_confirmation_property(self, domain: Domain, entity_id: str, db):
        """Send offer confirmation for property - Page 29: 1.5"""
        print(f"Sending offer confirmation for property {entity_id}")

# Global workflow manager instance
workflow_manager = WorkflowManager()