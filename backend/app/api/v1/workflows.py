from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.core.database import get_db
from app.core.workflows import workflow_manager, Domain
from app.models.property import Property
from app.models.tenancy import Tenancy
from app.models.vendor import Vendor
from app.models.applicant import Applicant
from app.models.workflow import WorkflowTransition

from pydantic import BaseModel
from typing import Optional, Dict, Any, List


router = APIRouter(prefix="/workflows", tags=["workflows"])


class TransitionRequest(BaseModel):
    new_status: str
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TransitionResponse(BaseModel):
    success: bool
    message: str
    previous_status: str
    new_status: str
    domain: str
    entity_id: str
    side_effects_executed: List[str] = []
    transitions_available: List[str] = []


@router.post("/{domain}/{entity_id}/transitions", response_model=TransitionResponse)
async def change_status(
    domain: str,
    entity_id: str,
    transition: TransitionRequest,
    db: Session = Depends(get_db)
):
    """
    Change status for any entity with workflow validation
    
    Domains: property, tenancy, vendor, applicant
    Validates transitions according to CRM blueprint workflows
    Executes automated side effects for specific transitions
    """
    try:
        # Validate domain
        try:
            domain_enum = Domain(domain.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid domain. Must be one of: {[d.value for d in Domain]}"
            )
        
        # ✅ KEEP THIS - Get entity based on domain (from your original function)
        entity = await get_entity_by_domain(domain_enum, entity_id, db)
        if not entity:
            raise HTTPException(
                status_code=404,
                detail=f"{domain.capitalize()} with ID {entity_id} not found"
            )
        
        current_status = getattr(entity, 'status')
        
        # Validate transition
        if not workflow_manager.validate_transition(domain_enum, current_status, transition.new_status):
            valid_transitions = workflow_manager.get_valid_transitions(domain_enum, current_status)
            raise HTTPException(
                status_code=400,
                detail=f"Invalid transition from '{current_status}' to '{transition.new_status}'. "
                       f"Valid transitions: {valid_transitions}"
            )
        
        # Execute transition
        previous_status = current_status
        setattr(entity, 'status', transition.new_status)
        
        # Execute side effects for this transition
        side_effects_executed = []
        try:
            await workflow_manager.execute_side_effects(
                domain_enum, entity_id, previous_status, transition.new_status, db
            )
            side_effects_executed = workflow_manager.get_side_effects(
                domain_enum, previous_status, transition.new_status
            )
        except Exception as e:
            # Log side effect errors but don't fail the transition
            print(f"Side effect error for {domain} {entity_id}: {e}")
        
        # ✅ NEW: Add audit trail (optional enhancement)
        try:
            
            transition_record = WorkflowTransition(
                domain=domain,
                entity_id=entity_id,
                from_status=previous_status,
                to_status=transition.new_status,
                user_id="user123",  # TODO: Get from auth context
                notes=transition.notes,
                metadata=transition.metadata,
                side_effects_executed=side_effects_executed
            )
            db.add(transition_record)
        except Exception as e:
            # Don't fail the main transition if audit logging fails
            print(f"Audit trail error: {e}")
        
        # Save changes (both entity status AND audit record if created)
        db.commit()
        db.refresh(entity)
        
        # Get available transitions for next steps
        available_transitions = workflow_manager.get_valid_transitions(
            domain_enum, transition.new_status
        )
        
        return TransitionResponse(
            success=True,
            message=f"Successfully transitioned {domain} from '{previous_status}' to '{transition.new_status}'",
            previous_status=previous_status,
            new_status=transition.new_status,
            domain=domain,
            entity_id=entity_id,
            side_effects_executed=side_effects_executed,
            transitions_available=available_transitions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error transitioning status: {str(e)}"
        )


async def get_entity_by_domain(domain: Domain, entity_id: str, db: Session):
    """Get entity by domain and ID"""
    model_map = {
        Domain.PROPERTY: (Property, "properties"),
        Domain.TENANCY: (Tenancy, "tenancies"),
        Domain.VENDOR: (Vendor, "vendors"),
        Domain.APPLICANT: (Applicant, "applicants")
    }
    
    model, table_name = model_map[domain]
    return db.query(model).filter(model.id == entity_id).first()



@router.get("/{domain}/{entity_id}/transitions")
def get_available_transitions(
    domain: str,
    entity_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all available status transitions for an entity
    Useful for UI to show only valid next steps
    """
    try:
        domain_enum = Domain(domain.lower())
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid domain. Must be one of: {[d.value for d in Domain]}"
        )
    
    entity = get_entity_by_domain(domain_enum, entity_id, db)
    if not entity:
        raise HTTPException(
            status_code=404,
            detail=f"{domain.capitalize()} with ID {entity_id} not found"
        )
    
    current_status = getattr(entity, 'status')
    available_transitions = workflow_manager.get_valid_transitions(domain_enum, current_status)
    
    return {
        "domain": domain,
        "entity_id": entity_id,
        "current_status": current_status,
        "available_transitions": available_transitions,
        "side_effects": {
            transition: workflow_manager.get_side_effects(domain_enum, current_status, transition)
            for transition in available_transitions
        }
    }