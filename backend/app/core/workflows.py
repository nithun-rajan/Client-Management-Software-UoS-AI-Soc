from typing import Dict, List, Optional
from fastapi import HTTPException
from enum import Enum
from datetime import datetime, timedelta, timezone
# --- 1. ADDED/UPDATED IMPORTS ---
from app.models.tenancy import Tenancy
from app.models.enums import TenancyStatus
from sqlalchemy.orm import Session
# --- END OF ADDED/UPDATED IMPORTS ---

class Domain(str, Enum):
    PROPERTY = "property"
    TENANCY = "tenancy"
    VENDOR = "vendor"
    APPLICANT = "applicant"
    VALUATION = "valuation"

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
                # Vendor sales progression - Updated with sales instruction workflow
                "new": ["valuation_booked", "instructed"],  # Can go straight to instructed
                
                "valuation_booked": ["instructed", "lost"],
                "instructed": ["active", "sstc", "withdrawn", "lost"],  # Added SSTC stage
                "active": ["sstc", "withdrawn", "lost"],  # Property on market
                "sstc": ["exchanged", "withdrawn", "lost"],  # Sold Subject to Contract
                "exchanged": ["completed", "withdrawn"],  # Contracts exchanged
                "completed": ["past_client"],  # Sale completed
                "withdrawn": ["new"],
                "lost": ["new"],
                "past_client": []  # Final state for successful sales
            },
            Domain.APPLICANT: {
                # Applicant lifecycle - Blueprint pages 21-27 + Sales buyer workflow (Pages 55-64)
                "new": ["qualified", "sales_qualified"],
                "qualified": ["viewing_booked", "archived"],
                "sales_qualified": ["sales_viewing_booked", "archived"],
                "viewing_booked": ["offer_submitted", "qualified", "archived"],
                "sales_viewing_booked": ["sales_offer_submitted", "sales_qualified", "archived"],
                "offer_submitted": ["offer_accepted", "viewing_booked", "archived"],  # Page 29
                "sales_offer_submitted": ["sales_offer_accepted", "sales_viewing_booked", "archived"],
                "offer_accepted": ["references", "viewing_booked"],  # Page 29: 1.2
                "sales_offer_accepted": ["sales_references", "sales_viewing_booked"],
                "references": ["let_agreed", "offer_accepted"],  # Page 30
                "sales_references": ["sales_let_agreed", "sales_offer_accepted"],
                "let_agreed": ["tenancy_started", "references"],  # Page 29
                "sales_let_agreed": ["exchange_agreed", "sales_references"],
                "tenancy_started": ["archived"],  # Page 33: 5.2
                "exchange_agreed": ["completed", "sales_let_agreed"],
                "completed": ["archived"],
                "archived": ["new"]
            },

            Domain.VALUATION: {
                # Valuation workflow states
                "draft": ["in_progress", "cancelled"],
                "in_progress": ["completed", "failed", "cancelled"],
                "completed": ["superseded", "archived"],
                "failed": ["draft", "archived"],
                "cancelled": ["draft"],
                "superseded": ["archived"],
                "archived": []
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
                "execute_move_in",  # Page 33: 5.1
                "trigger_compliance_tasks",
                "execute_generate_inventory_document"
            ],

            # Applicant transitions
            ("applicant", "offer_submitted", "offer_accepted"): [
                "update_applicant_status",  # Page 29: 1.2
                "create_tenancy_progression"  # Page 29: Start progression workflow
            ],
            ("applicant", "let_agreed", "tenancy_started"): [
                "archive_applicant_record",  # Page 33: 5.2
                "create_active_tenancy"  # Page 33: 5.2
            ],
            #Applicant (Sales transitions)
            # Add to self.side_effects
            ("applicant", "new", "sales_qualified"): [
                "setup_buyer_financial_profile",
                "schedule_mortgage_advice",
                "create_buyer_search_alerts"
            ],
            ("applicant", "sales_qualified", "sales_viewing_booked"): [
                "book_sales_viewing",
                "send_sales_property_pack", 
                "update_buyer_match_score"
            ],
            ("applicant", "sales_viewing_booked", "sales_offer_submitted"): [
                "create_sales_offer_record",
                "notify_vendor_of_offer",
                "start_sales_negotiation_process"
            ],
            ("applicant", "sales_offer_submitted", "sales_offer_accepted"): [
                "mark_offer_accepted_sales",
                "initiate_sales_progression",
                "collect_reservation_deposit"
            ],
            ("applicant", "sales_offer_accepted", "sales_references"): [
                "verify_buyer_finances_sales",
                "conduct_buyer_aml_checks",
                "connect_with_buyer_solicitor"
            ],
            ("applicant", "sales_references", "sales_let_agreed"): [
                "update_property_to_sstc",
                "generate_sales_memorandum", 
                "notify_parties_sstc_status"
            ],
            ("applicant", "sales_let_agreed", "exchange_agreed"): [
                "prepare_exchange_contracts",
                "conduct_pre_exchange_checks",
                "coordinate_completion_date"
            ],
            ("applicant", "exchange_agreed", "completed"): [
                "finalize_property_purchase",
                "process_land_registry_update",
                "archive_completed_buyer"
            ],

            #Vendor transitions
            ("vendor", "new", "instructed"): [
                "create_sales_progression",  # Start sales progression workflow
                "schedule_valuation",  # Schedule property valuation
                "notify_sales_team"  # Notify sales team of new instruction
            ],
            ("vendor", "instructed", "active"): [
                "list_property_on_portals",  # List property on Rightmove/Zoopla
                "create_sales_marketing_tasks"  # Create marketing tasks
            ],
            ("vendor", "active", "sstc"): [
                "update_property_status_sstc",  # Mark property as SSTC
                "notify_vendor_offer_accepted",  # Notify vendor of accepted offer
                "start_sales_progression"  # Begin sales progression workflow
            ],
            ("vendor", "sstc", "exchanged"): [
                "notify_vendor_exchanged",  # Notify vendor of exchange
                "schedule_completion"  # Schedule completion date
            ],
            ("vendor", "exchanged", "completed"): [
                "finalize_sale",  # Complete sale process
                "update_land_registry",  # Update land registry
                "archive_sales_progression"  # Archive sales progression
            ],

            ("vendor", "new", "valuation_booked"): [
                "schedule_valuation",
                "create_valuation_record",  # Add this
                "notify_agent_valuation_scheduled"
            ],
            ("vendor", "valuation_booked", "instructed"): [
                "generate_final_valuation",  # Add this - generate final valuation pack
                "create_sales_progression",
                "notify_sales_team"
            ],


            # Valuation transitions
            ("valuation", "draft", "in_progress"): [
                "generate_valuation_pack",  # Trigger AI valuation generation
                "notify_agent_valuation_started"
            ],
            ("valuation", "in_progress", "completed"): [
                "store_valuation_document",  # Save the generated valuation pack
                "notify_agent_valuation_ready",
                "link_valuation_to_property"
            ],
            ("valuation", "in_progress", "failed"): [
                "log_valuation_failure",
                "notify_agent_valuation_failed"
            ],
            ("valuation", "completed", "superseded"): [
                "archive_old_valuation",  # When new valuation is generated
                "update_property_valuation"
            ]
        }

    # --- NEW FUNCTION: LETTINGS GUARDS (ADDED) ---
    # This function is adapted to check string statuses against Enum values
    def validate_tenancy_guards(self, tenancy: Tenancy, new_status: str):

        """
        Checks if a tenancy is allowed to move to a new status
        based on the blueprint's "guard" rules (pages 29-34).

        This function is called by the API endpoint BEFORE updating the status.
        """

        # --- Guard for Stage 2: REFERENCING ---
        # Note: TenancyStatus.REFERENCING.value is "referencing"
        if new_status == TenancyStatus.REFERENCING.value:
            # GUARD: Must have paid holding deposit (Blueprint p. 29, 1.4)
            if not tenancy.holding_deposit_date:
                raise HTTPException(status_code=400,
                    detail="Cannot start referencing. Holding deposit has not been received.")

        # --- Guard for Stage 3: REFERENCED (after referencing is complete) ---
        # Note: TenancyStatus.REFERENCED.value is "referenced"
        elif new_status == TenancyStatus.REFERENCED.value:
            # GUARD: Must have passed referencing (Blueprint p. 30-31, 2.2 & 2.3)
            if tenancy.reference_status != "pass" or tenancy.right_to_rent_status != "pass":
                raise HTTPException(status_code=400,
                    detail="Cannot move to referenced. References and Right to Rent must be 'pass'.")

        # --- Guard for Stage 4: DOCUMENTATION ("legal_docs") ---
        # Note: TenancyStatus.DOCUMENTATION.value is "legal_docs"
        elif new_status == TenancyStatus.DOCUMENTATION.value:
            # GUARD: Must have signed docs and paid monies (Blueprint p. 31, 3.3 & 3.5)
            if not tenancy.tenancy_agreement_signed or not tenancy.move_in_monies_received:
                raise HTTPException(status_code=400,
                    detail="Cannot move to documentation. Tenancy agreement must be signed and move-in monies received.")

        # --- Guard for Stage 5: MOVE_IN_PREP ("ready_to_move_in") ---
        # Note: TenancyStatus.MOVE_IN_PREP.value is "ready_to_move_in"
        elif new_status == TenancyStatus.MOVE_IN_PREP.value:
            # GUARD: Must have compliance docs & inventory (Blueprint p. 32, 4.1 & 4.2)
            if not tenancy.inventory_check_in_complete or not tenancy.gas_safety_certificate_provided:
                 raise HTTPException(status_code=400,
                    detail="Cannot move to ready_to_move_in. Inventory check-in and compliance docs (Gas Safety) are required.")

        # --- Guard for Stage 6: ACTIVE ("active") ---
        # Note: TenancyStatus.ACTIVE.value is "active"
        elif new_status == TenancyStatus.ACTIVE.value:
            # GUARD: Must have compliance docs & inventory (Blueprint p. 32, 4.1 & 4.2)
            if not tenancy.inventory_check_in_complete or not tenancy.gas_safety_certificate_provided:
                 raise HTTPException(status_code=400,
                    detail="Cannot activate tenancy. Inventory check-in and compliance docs (Gas Safety) are required.")

        # All checks passed
        return True
    # --- END OF NEW FUNCTION ---

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
                due_date=datetime.now(timezone.utc) + timedelta(hours=24)
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
                    start_date=datetime.now(timezone.utc).date(),
                    end_date=(datetime.now(timezone.utc) + timedelta(days=365)).date(),
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
                due_date=datetime.now(timezone.utc) + timedelta(days=1)
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
                due_date=datetime.now(timezone.utc) + timedelta(hours=12)
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
                due_date=datetime.now(timezone.utc) + timedelta(days=7)
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
                due_date=datetime.now(timezone.utc) + timedelta(days=2)
            )
            db.add(task)
            print(f"Created task to collect holding deposit for tenancy {entity_id}")

    async def execute_send_offer_confirmation(self, domain: Domain, entity_id: str, db):
        """Send offer confirmation - Page 29: 1.5"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from app.services.email_service import send_templated_email
        from app.models.applicant import Applicant
        
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
                due_date=datetime.now(timezone.utc) + timedelta(hours=4)
            )
            db.add(task)

            try:
            # Find the applicant to get their email
                if tenancy.applicant_id:
                    applicant = db.query(Applicant).filter(Applicant.id == tenancy.applicant_id).first()
                    if applicant and applicant.email:
                        email_context = {
                            "applicant_name": applicant.first_name,
                            "property_address": tenancy.property.address,
                            "rent_amount": tenancy.agreed_rent
                        }
                        # This new function sends the email
                        await send_templated_email(
                            to_email=applicant.email,
                            template_name="offer_confirmation.html",
                            context=email_context
                        )
                        print(f"Successfully sent offer confirmation email to {applicant.email}")
                        task.status=TaskStatus.COMPLETED
                        task.priority=TaskPriority.LOW
                        task.description=f"Successfully sent offer confirmation email to {applicant.email}"
            except Exception as e:
                print(f"ERROR: Failed to send offer confirmation email: {e}")

    async def execute_start_referencing_process(self, domain: Domain, entity_id: str, db):
        """Start referencing process - Page 30: 2.1"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from app.services.referencing_service import start_referencing

        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()
        if tenancy:
            # Create task to start referencing (Goodlord API integration would go here)
            task = Task(
                title="Start Referencing Process",
                description="Start referencing process via API or manual process. Collect references from employer and previous landlord.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.now(timezone.utc) + timedelta(days=1)
            )
            db.add(task)
            print(f"Created task to start referencing for tenancy {entity_id}")

            try:
                # 2. Attempt the full automation
                reference_id = await start_referencing(tenancy)
            
                # 3. SUCCESS: Update the tenancy and the task
                tenancy.reference_status = "pending" #
                db.add(tenancy)
            
                task.status = TaskStatus.COMPLETED
                task.priority = TaskPriority.LOW
                task.description = f"Successfully submitted for referencing. Ref ID: {reference_id}"
            
                print(f"Successfully started referencing for tenancy {entity_id}")

            except Exception as e:
                # 4. FAILURE: Update the task with the error
                print(f"ERROR: Failed to start referencing: {e}")

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
                due_date=datetime.now(timezone.utc) + timedelta(days=3)
            )
            db.add(task)




    async def execute_draft_tenancy_agreement(self, domain: Domain, entity_id: str, db: Session):
        """Draft tenancy agreement - Page 31: 3.1"""
        import jinja2
        from weasyprint import HTML
        from app.api.v1.documents import upload_file_to_cloud
        from app.models.document import Document, DocumentType
        from app.schemas.documents import DocumentCreate
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        tenancy = db.query(Tenancy).filter(Tenancy.id == entity_id).first()

        if tenancy:

            # 1. Create workflow task (existing logic unchanged)
            task = Task(
                title="Draft Tenancy Agreement (AST)",
                description="Draft Assured Shorthold Tenancy agreement with all terms and conditions.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="tenancy",
                related_entity_id=entity_id,
                tenancy_id=entity_id,
                due_date=datetime.now(timezone.utc) + timedelta(days=5)
            )
            db.add(task)

            try:
                print(f"Starting AST generation for tenancy {entity_id}...")

                # 2. Load HTML template
                template_loader = jinja2.FileSystemLoader(searchpath="app/templates")
                template_env = jinja2.Environment(loader=template_loader)
                template = template_env.get_template("ast_template.html")

                # 3. Fill template context
                context = {
                    "tenant_name": f"{tenancy.applicant.first_name} {tenancy.applicant.last_name}",
                    "address": tenancy.property.address,
                    "start_date": tenancy.start_date.strftime("%d %B %Y"),
                    "end_date": tenancy.end_date.strftime("%d %B %Y"),
                    "rent": tenancy.agreed_rent,
                    "deposit": tenancy.deposit_amount
                }

                html_out = template.render(context)

                # 4. Convert HTML → PDF using WeasyPrint
                pdf_bytes = HTML(string=html_out).write_pdf()

                # 5. Create temporary file
                file_name = f"AST_{tenancy.property.address.replace(' ', '_')}.pdf"
                temp_file_path = f"/tmp/{file_name}"

                with open(temp_file_path, "wb") as f:
                    f.write(pdf_bytes)

                # 6. Upload to cloud / S3 / etc.
                file_path = upload_file_to_cloud(file_name, pdf_bytes)

                # 7. Save document record
                doc_create = DocumentCreate(
                title=file_name,
                document_type=DocumentType.TENANCY_AGREEMENT,
                file_url=file_path,
                file_name=file_name,
                file_size=len(pdf_bytes),
                mime_type="application/pdf",
                tenancy_id=tenancy.id,
                uploaded_by_user_id="system"
            )
                db_document = Document(**doc_create.model_dump())
                db.add(db_document)

                print(f"✅ Successfully generated and saved AST: {file_name}")
                task.status=TaskStatus.COMPLETED
                task.priority=TaskPriority.LOW
                task.description=f"Successfully generated and saved AST: {file_name}"

            except Exception as e:
                print(f"❌ ERROR: Failed to generate AST: {e}")
    
    async def execute_generate_inventory_document(self, domain: Domain, entity_id: str, db: Session):
        """Generates a blank inventory check-in document"""
        
        # --- Import models and schemas *inside* the function ---
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.document import Document, DocumentType
        from app.schemas.documents import DocumentCreate
        from app.api.v1.documents import upload_file_to_cloud
        import jinja2
        from weasyprint import HTML
        from sqlalchemy.orm import joinedload
        from app.models.enums import TaskStatus, TaskPriority
        
        # --- Eager load relationships ---
        tenancy = db.query(Tenancy).options(
            joinedload(Tenancy.property),
            joinedload(Tenancy.applicant)
        ).filter(Tenancy.id == entity_id).first()

        if not tenancy:
            print(f"ERROR: Tenancy {entity_id} not found for inventory generation.")
            return

        # 1. Create a task to track this
        task = Task(
            title="Generate Move-In Inventory Document",
            description="Generating inventory template for agent...",
            status=TaskStatus.TODO,
            priority=TaskPriority.MEDIUM,
            related_entity_type="tenancy",
            related_entity_id=entity_id,
            tenancy_id=entity_id
        )
        db.add(task)

        try:
            if not tenancy.property:
                raise Exception("Property not found. Cannot generate inventory.")

            # 2. Load HTML template
            template_loader = jinja2.FileSystemLoader(searchpath="app/templates")
            template_env = jinja2.Environment(loader=template_loader)
            template = template_env.get_template("inventory_template.html") # <-- New template

            # 3. Fill template context
            context = {
                "property_address": tenancy.property.address,
                "bedrooms": tenancy.property.bedrooms,
                "bathrooms": tenancy.property.bathrooms,
                "move_in_date": tenancy.start_date.strftime("%d %B %Y")
                # ... (any other fields your template needs)
            }
            html_out = template.render(context)

            # 4. Convert HTML → PDF
            pdf_bytes = HTML(string=html_out).write_pdf()
            file_name = f"Inventory_{tenancy.property.address.replace(' ', '_')}.pdf"

            # 5. Upload to cloud
            file_path = upload_file_to_cloud(file_name, pdf_bytes)

            # 6. Use the DocumentCreate schema to save it
            doc_create = DocumentCreate(
                title=file_name,
                document_type=DocumentType.INVENTORY, #
                file_url=file_path,
                file_name=file_name,
                file_size=len(pdf_bytes),
                mime_type="application/pdf",
                tenancy_id=tenancy.id,
                uploaded_by_user_id="system"
            )
            db_document = Document(**doc_create.model_dump())
            db.add(db_document)

            # 7. Update task to
            task.status = TaskStatus.COMPLETED
            task.priority = TaskPriority.LOW
            task.description = f"Successfully generated inventory document: {file_name}"
            print(f"✅ Successfully generated inventory: {file_name}")

        except Exception as e:
            print(f"❌ ERROR: Failed to generate inventory: {e}")

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
                due_date=datetime.now(timezone.utc) + timedelta(days=7)
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
                due_date=datetime.now(timezone.utc) + timedelta(days=10)
            )
            db.add(task)

    async def execute_register_security_deposit(self, domain: Domain, entity_id: str, db):
        """Register security deposit - Page 32: 3.4"""
        from app.models.tenancy import Tenancy
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from app.services.deposit_service import register_deposit

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
                due_date=datetime.now(timezone.utc) + timedelta(days=14)
            )
            db.add(task)

            try:
                # 2. Attempt the full automation
                registration_id = await register_deposit(tenancy)
        
                # 3. SUCCESS: Update the tenancy and the task
                tenancy.deposit_scheme_ref = registration_id
                tenancy.security_deposit_registered = True
                db.add(tenancy)
        
                task.status = TaskStatus.COMPLETED
                task.priority = TaskPriority.LOW
                task.description = f"Successfully registered deposit. Ref: {registration_id}"
        
                print(f"Successfully registered deposit for tenancy {entity_id}")

            except Exception as e:
                # 4. FAILURE: Update the task with the error
                print(f"ERROR: Failed to register deposit: {e}")

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
                property_obj.let_date = datetime.now(timezone.utc)

                # Create move-in tasks
                # Task 4.1: Arrange professional clean
                task_clean = Task(
                    title="Arrange Professional Clean",
                    description=f"Confirm pre-tenancy professional clean is complete for {property_obj.address_line1}.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.MEDIUM,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.now(timezone.utc) # Should be done by move-in day
                )

                task_inventory = Task(
                    title="Complete Move-In Inspection",
                    description=f"Complete move-in inspection and inventory check for property {property_obj.address_line1}",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.now(timezone.utc) + timedelta(days=1)
                )
                
                # Task 4.3: Utility & Council Tax notification
                task_utilities = Task(
                    title="Notify Utilities & Council Tax",
                    description=f"Notify suppliers (gas, electric, water) and council tax of new tenant move-in.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.MEDIUM,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.now(timezone.utc) + timedelta(days=3)
                )

                task_keys = Task(
                    title="Hand Over Keys",
                    description="Hand over keys to tenant and complete move-in checklist.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.now(timezone.utc)
                )
                
                # Task 4.5: Final progression checklist
                task_checklist = Task(
                    title="Complete Final Progression Checklist",
                    description="Final check: All docs signed, monies paid, keys handed over, systems updated.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.MEDIUM,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=datetime.now(timezone.utc) + timedelta(days=1)
                )

                # 5.4a: Schedule first rent payment
                task_rent = Task(
                    title="Confirm First Rent Payment Received",
                    description=f"Confirm first rent payment of £{tenancy.rent_amount or 'N/A'} has been received and standing order is set up.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=tenancy.start_date + timedelta(days=1) # Due 1 day after move-in
                )

                # 5.4b: Schedule management tasks
                task_inspection = Task(
                    title="Schedule First Management Inspection",
                    description=f"Schedule first quarterly management inspection for {property_obj.address_line1}.",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.MEDIUM,
                    related_entity_type="tenancy",
                    related_entity_id=entity_id,
                    tenancy_id=entity_id,
                    due_date=tenancy.start_date + timedelta(days=90) # Due in 90 days
                )

                db.add(task_clean)
                db.add(task_inventory)
                db.add(task_utilities)
                db.add(task_keys)
                db.add(task_checklist)
                db.add(task_rent)
                db.add(task_inspection)
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
                due_date=datetime.now(timezone.utc) + timedelta(hours=2)
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
                due_date=datetime.now(timezone.utc) + timedelta(days=2)
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
                due_date=datetime.now(timezone.utc) + timedelta(hours=4)
            )
            db.add(task)


    #Vendors side effects
    async def execute_create_sales_progression(self, domain: Domain, entity_id: str, db):
        """Create sales progression record when vendor is instructed"""
        from app.models.vendor import Vendor
        from app.models.sales import SalesProgression
        from app.models.enums_sales import SalesStage, SalesStatus
        from datetime import datetime, timezone

        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor and vendor.instructed_property_id:
            # Check if sales progression already exists
            existing = db.query(SalesProgression).filter(
                SalesProgression.vendor_id == entity_id,
                SalesProgression.property_id == vendor.instructed_property_id
            ).first()

            if not existing:
                sales_progression = SalesProgression(
                    vendor_id=entity_id,
                    property_id=vendor.instructed_property_id,
                    current_stage=SalesStage.OFFER_ACCEPTED,
                    sales_status=SalesStatus.UNDER_OFFER,
                    instruction_type=vendor.instruction_type,
                    agreed_commission=vendor.agreed_commission,
                    minimum_fee=vendor.minimum_fee
                )
                db.add(sales_progression)
                print(f"Created sales progression for vendor {entity_id}")

    async def execute_list_property_on_portals(self, domain: Domain, entity_id: str, db):
        """List property on portals when vendor goes active"""
        from app.models.vendor import Vendor
        from app.models.property import Property
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from datetime import datetime, timezone, timedelta

        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor and vendor.instructed_property_id:
            property_obj = db.query(Property).filter(Property.id == vendor.instructed_property_id).first()
            if property_obj:
                task = Task(
                    title="List Property on Portals",
                    description=f"List property {property_obj.address} on Rightmove, Zoopla, and other portals",
                    status=TaskStatus.TODO,
                    priority=TaskPriority.HIGH,
                    related_entity_type="vendor",
                    related_entity_id=entity_id,
                    due_date=datetime.now(timezone.utc) + timedelta(hours=24)
                )
                db.add(task)

    async def execute_update_property_status_sstc(self, domain: Domain, entity_id: str, db):
        """Update property status to SSTC when vendor moves to SSTC"""
        from app.models.vendor import Vendor
        from app.models.property import Property

        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor and vendor.instructed_property_id:
            property_obj = db.query(Property).filter(Property.id == vendor.instructed_property_id).first()
            if property_obj:
                property_obj.sales_status = "sstc"
                print(f"Updated property {vendor.instructed_property_id} status to SSTC")

    async def execute_notify_vendor_offer_accepted(self, domain: Domain, entity_id: str, db):
        """Notify vendor when offer is accepted (SSTC)"""
        from app.models.vendor import Vendor
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from datetime import datetime, timezone, timedelta

        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor:
            task = Task(
                title="Notify Vendor of Accepted Offer",
                description=f"Notify {vendor.first_name} {vendor.last_name} that their offer has been accepted and property is SSTC",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="vendor",
                related_entity_id=entity_id,
                due_date=datetime.now(timezone.utc) + timedelta(hours=4)
            )
            db.add(task)

    async def execute_schedule_valuation(self, domain: Domain, entity_id: str, db):
        """Schedule property valuation for new vendors"""
        from app.models.vendor import Vendor
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        from datetime import datetime, timezone, timedelta

        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor:
            task = Task(
                title="Schedule Property Valuation",
                description=f"Schedule valuation appointment with {vendor.first_name} {vendor.last_name}",
                status=TaskStatus.TODO,
                priority=TaskPriority.MEDIUM,
                related_entity_type="vendor",
                related_entity_id=entity_id,
                due_date=datetime.now(timezone.utc) + timedelta(days=2)
            )
            db.add(task)

    #valuation packs
    
    async def execute_generate_valuation_pack(self, domain: Domain, entity_id: str, db):
        """Generate AI valuation pack when valuation starts"""
        from app.models.valuation import Valuation
        from app.services.valuation_service import get_valuation_service
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation:
            try:
                valuation_service = await get_valuation_service()
                
                # Get property data for valuation
                property_data = {
                    'id': valuation.property_id,
                    'full_address': valuation.property.address if valuation.property else "Unknown",
                    'postcode': valuation.property.postcode if valuation.property else "Unknown",
                    'property_type': valuation.property.property_type if valuation.property else "Unknown",
                    'bedrooms': valuation.property.bedrooms if valuation.property else 0,
                    'bathrooms': valuation.property.bathrooms if valuation.property else 0,
                    'floor_area_sqm': valuation.property.floor_area_sqft / 10.764 if valuation.property and valuation.property.floor_area_sqft else None,
                    'tenure': 'Unknown'
                }
                
                # Generate valuation pack
                result = await valuation_service.generate_sales_valuation_pack(property_data)
                
                if result.get("success"):
                    # Update valuation with results
                    valuation_data = result["valuation"]
                    valuation.estimated_value = valuation_data.get("estimated_value")
                    valuation.value_range_min = valuation_data.get("value_range_min")
                    valuation.value_range_max = valuation_data.get("value_range_max")
                    valuation.confidence = valuation_data.get("confidence")
                    valuation.market_conditions = valuation_data.get("market_conditions")
                    valuation.comparable_properties = valuation_data.get("comparable_properties")
                    valuation.key_factors = valuation_data.get("key_factors")
                    valuation.recommended_price = valuation_data.get("recommended_price")
                    valuation.pricing_strategy = valuation_data.get("pricing_strategy")
                    valuation.recommendations = valuation_data.get("recommendations")
                    valuation.property_advantages = valuation_data.get("property_advantages")
                    valuation.property_limitations = valuation_data.get("property_limitations")
                    valuation.location_analysis = valuation_data.get("location_analysis")
                    valuation.valuation_logic = valuation_data.get("valuation_logic")
                    valuation.location_infrastructure = valuation_data.get("location_infrastructure")
                    
                    print(f"Successfully generated valuation pack for {entity_id}")
                else:
                    print(f"Valuation generation failed: {result.get('error')}")
                    
            except Exception as e:
                print(f"Error generating valuation pack: {str(e)}")

    async def execute_notify_agent_valuation_started(self, domain: Domain, entity_id: str, db):
        """Notify agent that valuation generation has started"""
        from app.models.valuation import Valuation
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation and valuation.property:
            task = Task(
                title="Valuation Generation Started",
                description=f"AI valuation generation started for {valuation.property.address}",
                status=TaskStatus.IN_PROGRESS,
                priority=TaskPriority.MEDIUM,
                related_entity_type="valuation",
                related_entity_id=entity_id
            )
            db.add(task)

    async def execute_store_valuation_document(self, domain: Domain, entity_id: str, db):
        """Store the completed valuation document"""
        from app.models.valuation import Valuation
        from app.models.document import Document
        from app.models.enums import DocumentType
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation:
            # Create document record for the valuation pack
            document = Document(
                title=f"Valuation Report - {valuation.property.address if valuation.property else 'Unknown'}",
                document_type=DocumentType.VALUATION_REPORT,
                related_entity_type="valuation",
                related_entity_id=entity_id,
                file_path=f"/valuations/{entity_id}.pdf",  # Path where PDF would be stored
                metadata={
                    "valuation_type": valuation.valuation_type,
                    "estimated_value": valuation.estimated_value,
                    "confidence": valuation.confidence,
                    "generated_at": valuation.updated_at.isoformat()
                }
            )
            db.add(document)
            print(f"Created valuation document record for {entity_id}")

    async def execute_notify_agent_valuation_ready(self, domain: Domain, entity_id: str, db):
        """Notify agent that valuation is ready"""
        from app.models.valuation import Valuation
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation and valuation.property:
            task = Task(
                title="Valuation Report Ready",
                description=f"AI valuation report ready for {valuation.property.address}. Estimated value: £{valuation.estimated_value:,.2f}",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="valuation",
                related_entity_id=entity_id
            )
            db.add(task)

    async def execute_link_valuation_to_property(self, domain: Domain, entity_id: str, db):
        """Link valuation to property for easy access"""
        from app.models.valuation import Valuation
        from app.models.property import Property
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation and valuation.property_id:
            # This is handled by the foreign key relationship
            # Could add additional logic here if needed
            print(f"Valuation {entity_id} linked to property {valuation.property_id}")

    async def execute_log_valuation_failure(self, domain: Domain, entity_id: str, db):
        """Log valuation generation failure"""
        from app.models.valuation import Valuation
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation:
            valuation.valuation_logic = "Valuation generation failed. Please try again or contact support."
            print(f"Logged valuation failure for {entity_id}")

    async def execute_notify_agent_valuation_failed(self, domain: Domain, entity_id: str, db):
        """Notify agent that valuation generation failed"""
        from app.models.valuation import Valuation
        from app.models.task import Task
        from app.models.enums import TaskStatus, TaskPriority
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation and valuation.property:
            task = Task(
                title="Valuation Generation Failed",
                description=f"AI valuation generation failed for {valuation.property.address}. Please review and retry.",
                status=TaskStatus.TODO,
                priority=TaskPriority.HIGH,
                related_entity_type="valuation",
                related_entity_id=entity_id
            )
            db.add(task)

    async def execute_archive_old_valuation(self, domain: Domain, entity_id: str, db):
        """Archive old valuation when new one is generated"""
        from app.models.valuation import Valuation
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation and valuation.property_id:
            # Archive other active valuations for the same property
            old_valuations = db.query(Valuation).filter(
                Valuation.property_id == valuation.property_id,
                Valuation.id != entity_id,
                Valuation.status == "active"
            ).all()
            
            for old_val in old_valuations:
                old_val.status = "superseded"
            
            print(f"Archived {len(old_valuations)} old valuations for property {valuation.property_id}")

    async def execute_update_property_valuation(self, domain: Domain, entity_id: str, db):
        """Update property with latest valuation data"""
        from app.models.valuation import Valuation
        from app.models.property import Property
        
        valuation = db.query(Valuation).filter(Valuation.id == entity_id).first()
        if valuation and valuation.property_id and valuation.status == "active":
            property_obj = db.query(Property).filter(Property.id == valuation.property_id).first()
            if property_obj and valuation.valuation_type == "sales":
                # Update property with valuation data for quick reference
                # This could be stored in a separate field or relationship
                print(f"Property {valuation.property_id} updated with new valuation data")

    async def execute_create_valuation_record(self, domain: Domain, entity_id: str, db):
        """Create valuation record when valuation is booked"""
        from app.models.vendor import Vendor
        from app.models.valuation import Valuation
        
        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor and vendor.instructed_property_id:
            # Create draft valuation record
            valuation = Valuation(
                property_id=vendor.instructed_property_id,
                valuation_type="sales",
                valuation_method="ai_analysis",
                status="draft"
            )
            db.add(valuation)
            print(f"Created draft valuation record for vendor {entity_id}")

    async def execute_generate_final_valuation(self, domain: Domain, entity_id: str, db):
        """Generate final valuation pack when vendor is instructed"""
        from app.models.vendor import Vendor
        from app.models.valuation import Valuation
        
        vendor = db.query(Vendor).filter(Vendor.id == entity_id).first()
        if vendor and vendor.instructed_property_id:
            # Find the draft valuation and trigger generation
            valuation = db.query(Valuation).filter(
                Valuation.property_id == vendor.instructed_property_id,
                Valuation.status == "draft"
            ).first()
            
            if valuation:
                # Trigger workflow transition to start valuation generation
                await self.execute_side_effects(Domain.VALUATION, valuation.id, "draft", "in_progress", db)

# Global workflow manager instance
workflow_manager = WorkflowManager()
