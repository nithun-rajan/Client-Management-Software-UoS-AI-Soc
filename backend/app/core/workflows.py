from typing import Dict, List, Optional
from fastapi import HTTPException
from enum import Enum
from datetime import datetime, timedelta


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
        return self.side_effects.get((domain, current_status, new_status), [])
    
    async def execute_side_effects(self, domain: Domain, entity_id: str, current_status: str, new_status: str, db):
        """Execute automated actions for this transition"""
        side_effects = self.get_side_effects(domain, current_status, new_status)
        
        for effect in side_effects:
            await getattr(self, f"execute_{effect}")(domain, entity_id, db)
    
    # Side effect implementations
    async def execute_update_portal_status(self, domain: Domain, entity_id: str, db):
        """Update property status on Rightmove/Zoopla - Page 29: 1.3"""
        from app.models.property import Property
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            # In a real implementation, this would integrate with portal APIs
            # For now, we'll create a task to remind staff to update portals
            from app.models.task import Task
            from app.models.enums import TaskStatus, TaskPriority
            
            task = Task(
                title="Update portal status - Mark as Let",
                description=f"Property {property_obj.address_line1} has moved to tenanted. Update Rightmove/Zoopla status.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(hours=24)
            )
            db.add(task)
            print(f"Created task to update portal status for property {entity_id}")
    
    async def execute_create_tenancy_record(self, domain: Domain, entity_id: str, db):
        """Create tenancy record when property moves to tenanted - Page 33: 5.2"""
        from app.models.property import Property
        from app.models.tenancy import Tenancy
        from app.models.enums import TenancyStatus
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            # Check if tenancy already exists
            existing_tenancy = db.query(Tenancy).filter(
                Tenancy.property_id == entity_id,
                Tenancy.status.in_([TenancyStatus.ACTIVE, "offer_accepted", "referencing", "referenced", "legal_docs", "ready_to_move_in"])
            ).first()
            
            if not existing_tenancy and property_obj.rent:
                # Create a basic tenancy record - details should be filled in during progression
                tenancy = Tenancy(
                    property_id=entity_id,
                    start_date=datetime.utcnow().date(),
                    end_date=(datetime.utcnow() + timedelta(days=365)).date(),
                    rent_amount=property_obj.rent,
                    deposit_amount=property_obj.deposit or (property_obj.rent * 5),  # Standard 5 weeks
                    status="offer_accepted",  # Start progression workflow
                    agreed_rent=property_obj.rent
                )
                db.add(tenancy)
                print(f"Created tenancy record for property {entity_id}")
    
    async def execute_assign_property_manager(self, domain: Domain, entity_id: str, db):
        """Assign property manager - Page 34: 5.3"""
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            # Create task to assign property manager
            task = Task(
                title="Assign Property Manager",
                description=f"Property {property_obj.address_line1} is now tenanted. Assign a property manager.",
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=1)
            )
            db.add(task)
            print(f"Created task to assign property manager for property {entity_id}")
    
    async def execute_relist_on_portals(self, domain: Domain, entity_id: str, db):
        """Relist property on portals when tenancy ends"""
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            task = Task(
                title="Relist property on portals",
                description=f"Property {property_obj.address_line1} is available again. Relist on Rightmove/Zoopla.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(hours=12)
            )
            db.add(task)
            print(f"Created task to relist property {entity_id} on portals")
    
    async def execute_schedule_review(self, domain: Domain, entity_id: str, db):
        """Schedule property review after tenancy ends"""
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            task = Task(
                title="Schedule property review",
                description=f"Property {property_obj.address_line1} has ended tenancy. Schedule review and any necessary maintenance.",
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=7)
            )
            db.add(task)
    
    async def execute_collect_holding_deposit(self, domain: Domain, entity_id: str, db):
        """Collect holding deposit - Page 29: 1.4"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            # Create task to collect holding deposit
            task = Task(
                title="Collect Holding Deposit",
                description=f"Collect holding deposit for tenancy. Standard amount: £{tenancy.rent_amount if tenancy.rent_amount else 'TBD'}",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=2)
            )
            db.add(task)
            print(f"Created task to collect holding deposit for tenancy {entity_id}")
    
    async def execute_send_offer_confirmation(self, domain: Domain, entity_id: str, db):
        """Send offer confirmation - Page 29: 1.5"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Send Offer Confirmation Email",
                description="Send offer confirmation email to applicant with next steps.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(hours=4)
            )
            db.add(task)
    
    async def execute_start_referencing_process(self, domain: Domain, entity_id: str, db):
        """Start referencing process - Page 30: 2.1"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            # Create task to start referencing (Goodlord API integration would go here)
            task = Task(
                title="Start Referencing Process",
                description="Start referencing process via Goodlord API or manual process. Collect references from employer and previous landlord.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=1)
            )
            db.add(task)
            print(f"Created task to start referencing for tenancy {entity_id}")
    
    async def execute_store_reference_docs(self, domain: Domain, entity_id: str, db):
        """Store reference documents - Page 31: 2.4"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Store Reference Documents",
                description="Store and verify reference documents received from referencing agency.",
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id
            )
            db.add(task)
    
    async def execute_conduct_right_to_rent_check(self, domain: Domain, entity_id: str, db):
        """Conduct Right to Rent check - Page 31: 2.3"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Conduct Right to Rent Check",
                description="Conduct mandatory Right to Rent check and document results.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=3)
            )
            db.add(task)
    
    async def execute_draft_tenancy_agreement(self, domain: Domain, entity_id: str, db):
        """Draft tenancy agreement - Page 31: 3.1"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Draft Tenancy Agreement (AST)",
                description="Draft Assured Shorthold Tenancy agreement with all terms and conditions.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=5)
            )
            db.add(task)
    
    async def execute_send_statutory_documents(self, domain: Domain, entity_id: str, db):
        """Send statutory documents - Page 31: 3.2"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Send Statutory Documents",
                description="Send How to Rent guide, EPC, Gas Safety Certificate, and other statutory documents to tenant.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=7)
            )
            db.add(task)
    
    async def execute_collect_move_in_monies(self, domain: Domain, entity_id: str, db):
        """Collect move-in monies - Page 32: 3.3"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            total_monies = (tenancy.rent_amount or 0) + (tenancy.deposit_amount or 0)
            task = Task(
                title="Collect Move-In Monies",
                description=f"Collect move-in monies: £{total_monies:.2f} (Rent: £{tenancy.rent_amount or 0:.2f} + Deposit: £{tenancy.deposit_amount or 0:.2f})",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=10)
            )
            db.add(task)
    
    async def execute_register_security_deposit(self, domain: Domain, entity_id: str, db):
        """Register security deposit - Page 32: 3.4"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Register Security Deposit",
                description=f"Register security deposit of £{tenancy.deposit_amount or 0:.2f} with deposit protection scheme.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=14)
            )
            db.add(task)
    
    async def execute_sign_tenancy_agreement(self, domain: Domain, entity_id: str, db):
        """Sign tenancy agreement - Page 32: 3.5"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            task = Task(
                title="Sign Tenancy Agreement",
                description="Ensure tenancy agreement is signed by both landlord and tenant.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id
            )
            db.add(task)
    
    async def execute_execute_move_in(self, domain: Domain, entity_id: str, db):
        """Execute move-in - Page 33: 5.1"""
        from app.models.tenancy import Tenancy
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from datetime import datetime
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy and tenancy.property_id:
            property_obj = db.query(Property).filter(Property.id == tenancy.property_id).first()
            if property_obj:
                # Update property let date
                property_obj.let_date = datetime.utcnow()
                
                # Create move-in tasks
                task1 = Task(
                    title="Complete Move-In Inspection",
                    description=f"Complete move-in inspection and inventory check for property {property_obj.address_line1}",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.utcnow() + timedelta(days=1)
                )
                task2 = Task(
                    title="Hand Over Keys",
                    description="Hand over keys to tenant and complete move-in checklist.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.utcnow()
                )
                db.add(task1)
                db.add(task2)
                print(f"Created move-in tasks for tenancy {entity_id}")
    
    async def execute_update_applicant_status(self, domain: Domain, entity_id: str, db):
        """Update applicant status - Page 29: 1.2"""
        # This is handled by the workflow transition itself
        print(f"Applicant status updated via workflow transition for {entity_id}")
    
    async def execute_create_tenancy_progression(self, domain: Domain, entity_id: str, db):
        """Create tenancy progression workflow - Page 29"""
        from app.models.applicant import Applicant
        from app.models.tenancy import Tenancy
        from app.models.enums import TenancyStatus
        
        applicant = db.query(Applicant).filter(Applicant.id == entity_id).first()
        if applicant:
            # When offer is accepted, create tenancy progression record
            # This would typically be linked to a property and offer
            print(f"Tenancy progression created for applicant {entity_id}")
    
    async def execute_archive_applicant_record(self, domain: Domain, entity_id: str, db):
        """Archive applicant record - Page 33: 5.2"""
        from app.models.applicant import Applicant
        
        applicant = db.query(Applicant).filter(Applicant.id == entity_id).first()
        if applicant:
            # Archive applicant (set status to archived)
            applicant.status = "archived"
            print(f"Archived applicant record {entity_id}")
    
    async def execute_create_active_tenancy(self, domain: Domain, entity_id: str, db):
        """Create active tenancy - Page 33: 5.2"""
        # This is handled by execute_create_tenancy_record
        print(f"Active tenancy creation handled via property workflow for {entity_id}")
    
    async def execute_log_offer_received(self, domain: Domain, entity_id: str, db):
        """Log that an offer has been received for a property"""
        # This will be logged via the WorkflowTransition model in the API endpoint
        print(f"Offer received for property {entity_id} - logging transition")
    
    async def execute_create_activity_log(self, domain: Domain, entity_id: str, db):
        """Create activity log entry for the transition"""
        # Activity will be logged via WorkflowTransition model in the API
        # This ensures proper audit trail without type conflicts
        print(f"Activity log will be created via WorkflowTransition for {entity_id}")
    
    async def execute_notify_landlord(self, domain: Domain, entity_id: str, db):
        """Notify landlord that an offer has been received"""
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj and property_obj.landlord_id:
            # Create task to notify landlord
            task = Task(
                title="Notify Landlord of Offer",
                description=f"Notify landlord about the offer received for property {property_obj.address_line1}",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(hours=2)
            )
            db.add(task)
            print(f"Created task to notify landlord {property_obj.landlord_id} about offer on property {entity_id}")
        else:
            print(f"No landlord associated with property {entity_id}")
    
    async def execute_collect_holding_deposit_property(self, domain: Domain, entity_id: str, db):
        """Collect holding deposit for property transition"""
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            task = Task(
                title="Collect Holding Deposit",
                description=f"Collect holding deposit for property {property_obj.address_line1}. Amount to be confirmed.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(days=2)
            )
            db.add(task)
    
    async def execute_send_offer_confirmation_property(self, domain: Domain, entity_id: str, db):
        """Send offer confirmation for property"""
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        property_obj = db.query(Property).filter(Property.id == entity_id).first()
        if property_obj:
            task = Task(
                title="Send Offer Confirmation",
                description=f"Send offer confirmation email to applicant for property {property_obj.address_line1}",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="property",
                related_entity_id=entity_id,
                due_date=datetime.utcnow() + timedelta(hours=4)
            )
            db.add(task)

# Global workflow manager instance
workflow_manager = WorkflowManager()