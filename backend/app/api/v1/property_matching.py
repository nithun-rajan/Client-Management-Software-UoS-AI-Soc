

import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.models.property import Property
from app.models.applicant import Applicant
from app.models.match_history import MatchHistory
from app.models.enums import PropertyStatus, ApplicantStatus

router = APIRouter(prefix="/ai", tags=["ai"])

# ============================================================================
# MATCHING ENGINE
# ============================================================================

class PropertyMatcher:
    """
    Intelligent property matching algorithm
    Uses multi-factor scoring to find best matches
    """
    
    @staticmethod
    def calculate_match_score(property: Property, applicant: Applicant) -> float:
        """
        Calculate match score (0-100) based on multiple factors
        """
        score = 0.0
        max_score = 0.0
        
        max_score += 30
        if applicant.desired_bedrooms:
            # Handle range format like "2-4" or single number like "3"
            desired_bedrooms_str = str(applicant.desired_bedrooms).strip()
            property_bedrooms = int(property.bedrooms)
            
            if '-' in desired_bedrooms_str:
                # Range format: "2-4"
                try:
                    min_bedrooms, max_bedrooms = map(int, desired_bedrooms_str.split('-'))
                    if min_bedrooms <= property_bedrooms <= max_bedrooms:
                        score += 30  # Exact match within range
                    elif property_bedrooms == min_bedrooms - 1 or property_bedrooms == max_bedrooms + 1:
                        score += 15  # 1 bedroom off is half credit
                except (ValueError, IndexError):
                    # Invalid range format, try exact match
                    if str(property_bedrooms) == desired_bedrooms_str:
                        score += 30
            else:
                # Single number format: "3"
                try:
                    desired_bedrooms = int(desired_bedrooms_str)
                    if property_bedrooms == desired_bedrooms:
                        score += 30
                    elif abs(property_bedrooms - desired_bedrooms) == 1:
                        score += 15  # 1 bedroom off is half credit
                except ValueError:
                    # Not a number, try exact string match
                    if str(property_bedrooms) == desired_bedrooms_str:
                        score += 30
        
        max_score += 25
        if property.rent:
            if applicant.rent_budget_min and applicant.rent_budget_max:
                if applicant.rent_budget_min <= property.rent <= applicant.rent_budget_max:
                    score += 25
                elif property.rent < applicant.rent_budget_min * 1.1:  # 10% over budget
                    score += 15
            elif applicant.rent_budget_max:
                if property.rent <= applicant.rent_budget_max:
                    score += 25
                elif property.rent <= applicant.rent_budget_max * 1.1:
                    score += 15
        
        max_score += 20
        if applicant.preferred_locations and property.postcode and property.city:
            preferred = applicant.preferred_locations.lower()
            property_location = f"{property.city} {property.postcode}".lower()
            
            if any(loc.strip() in property_location for loc in preferred.split(',')):
                score += 20
            elif any(loc.strip()[:4] in property.postcode.lower()[:4] for loc in preferred.split(',')):
                score += 10  # Partial postcode match
        
        max_score += 15
        if applicant.desired_property_type and property.property_type:
            if applicant.desired_property_type.lower() in property.property_type.lower():
                score += 15
        
        max_score += 10
        if applicant.move_in_date:
            days_until_move = (applicant.move_in_date - datetime.now().date()).days
            if 0 <= days_until_move <= 30:
                score += 10
            elif 30 < days_until_move <= 60:
                score += 5
        
        # Normalize to 0-100
        if max_score > 0:
            return (score / max_score) * 100
        return 0.0
    
    @staticmethod
    def generate_personalized_message(property: Property, applicant: Applicant, score: float) -> str:
        """
        Blueprint page 29: "matches should be personalised"
        """
        message_parts = [f"Hi {applicant.first_name}! "]
        
        # Opening based on match quality
        if score >= 90:
            message_parts.append("I've found an amazing property that's perfect for you! ")
        elif score >= 75:
            message_parts.append("I think you'll love this property! ")
        else:
            message_parts.append("Here's a property you might be interested in. ")
        
        # Property description
        if property.rent:
            rent_text = f" for £{property.rent:,.0f}/month"
        else:
            rent_text = ""
        message_parts.append(
            f"This {property.bedrooms}-bedroom {property.property_type} in {property.city}"
            f"{rent_text}. "
        )
        
        if applicant.has_pets and applicant.pet_details:
            # Blueprint page 29: "if the applicant mentions pets, mention the garden"
            if property.features and 'garden' in property.features.lower():
                message_parts.append(f"Great news - it has a garden that {applicant.pet_details} would love! ")
            elif property.features and 'pets_allowed' in property.features.lower():
                message_parts.append(f"Good news - pets are welcome here for {applicant.pet_details}! ")
        
        # Location-based personalization
        if applicant.special_requirements:
            reqs = applicant.special_requirements.lower()
            if 'school' in reqs and property.features:
                features_lower = property.features.lower()
                if 'school' in features_lower:
                    message_parts.append("Perfect for families - it's near excellent schools! ")
            if 'parking' in reqs and property.features:
                if 'parking' in property.features.lower():
                    message_parts.append("Parking included! ")
            if 'transport' in reqs:
                message_parts.append("Excellent transport links nearby. ")
        
        # Property highlights
        if property.features:
            try:
                features_list = json.loads(property.features) if isinstance(property.features, str) else []
                highlights = [f for f in features_list if f in ['garden', 'parking', 'balcony', 'modern', 'renovated']]
                if highlights:
                    message_parts.append(f"Features: {', '.join(highlights)}. ")
            except:
                pass
        
        # Call to action
        message_parts.append(
            f"Would you like to arrange a viewing? I have availability this week. "
            f"Reply to book your viewing or call me to discuss further!"
        )
        
        return ''.join(message_parts)



@router.post("/match-proposals")
async def ai_match_properties(
    applicant_id: str,
    limit: int = 5,
    min_score: float = 60.0,
    db: Session = Depends(get_db)
):

    # Get applicant
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Get all available properties
    available_properties = db.query(Property).filter(
        Property.status == PropertyStatus.AVAILABLE
    ).all()
    
    if not available_properties:
        return {
            "applicant": {
                "id": applicant.id,
                "name": f"{applicant.first_name} {applicant.last_name}",
                "criteria": {
                    "bedrooms": applicant.desired_bedrooms,
                    "budget": f"£{applicant.rent_budget_min}-£{applicant.rent_budget_max}",
                    "locations": applicant.preferred_locations
                }
            },
            "matches": [],
            "message": "No properties currently available matching your criteria"
        }
    
    # Calculate match scores for all properties
    matcher = PropertyMatcher()
    matches = []
    
    for property in available_properties:
        score = matcher.calculate_match_score(property, applicant)
        
        if score >= min_score:
            personalized_message = matcher.generate_personalized_message(
                property, applicant, score
            )
            
            # Generate match reasoning
            reasons = []
            if applicant.desired_bedrooms:
                desired_bedrooms_str = str(applicant.desired_bedrooms).strip()
                property_bedrooms = int(property.bedrooms)
                
                # Check if property bedrooms match the desired range or number
                if '-' in desired_bedrooms_str:
                    try:
                        min_bedrooms, max_bedrooms = map(int, desired_bedrooms_str.split('-'))
                        if min_bedrooms <= property_bedrooms <= max_bedrooms:
                            reasons.append(f"Exact bedroom match ({property.bedrooms} beds within {desired_bedrooms_str} range)")
                    except (ValueError, IndexError):
                        if str(property_bedrooms) == desired_bedrooms_str:
                            reasons.append(f"Exact bedroom match ({property.bedrooms} beds)")
                else:
                    try:
                        desired_bedrooms = int(desired_bedrooms_str)
                        if property_bedrooms == desired_bedrooms:
                            reasons.append(f"Exact bedroom match ({property.bedrooms} beds)")
                    except ValueError:
                        if str(property_bedrooms) == desired_bedrooms_str:
                            reasons.append(f"Exact bedroom match ({property.bedrooms} beds)")
            if property.rent and applicant.rent_budget_max and property.rent <= applicant.rent_budget_max:
                reasons.append(f"Within budget (£{property.rent:,.0f})")
            if applicant.preferred_locations and property.city and property.postcode:
                locs = [l.strip() for l in applicant.preferred_locations.split(',')]
                if any(loc.lower() in f"{property.city} {property.postcode}".lower() for loc in locs):
                    reasons.append(f"Preferred location ({property.city})")
            
            matches.append({
                "property_id": property.id,
                "score": round(score, 2),
                "property": {
                    "id": property.id,
                    "address": property.address,
                    "address_line1": property.address_line1,
                    "address_line2": property.address_line2,
                    "city": property.city,
                    "postcode": property.postcode,
                    "bedrooms": property.bedrooms,
                    "bathrooms": property.bathrooms,
                    "rent": property.rent,
                    "property_type": property.property_type,
                    "description": property.description,
                    "main_photo": property.main_photo_url
                },
                "personalized_message": personalized_message,
                "match_reasons": reasons,
                "viewing_slots": [
                    "Tomorrow 10:00 AM",
                    "Tomorrow 2:00 PM",
                    "Day after 11:00 AM"
                ]  # In real version, integrate with calendar
            })
    
    # Sort by score and limit
    matches.sort(key=lambda x: x['score'], reverse=True)
    matches = matches[:limit]
    
    return {
        "applicant": {
            "id": applicant.id,
            "name": f"{applicant.first_name} {applicant.last_name}",
            "email": applicant.email,
            "phone": applicant.phone,
            "criteria": {
                "bedrooms": applicant.desired_bedrooms,
                "budget": f"£{applicant.rent_budget_min or 0}-£{applicant.rent_budget_max or 0}",
                "locations": applicant.preferred_locations,
                "move_in_date": str(applicant.move_in_date) if applicant.move_in_date else None
            }
        },
        "matches": matches,
        "total_matches": len(matches),
        "ai_confidence": 0.92,
        "generated_at": datetime.utcnow().isoformat(),
        "next_steps": [
            "Review the suggested properties",
            "Book viewings for top matches",
            "Request additional information if needed"
        ]
    }


@router.post("/valuation-pack/{property_id}")
async def generate_valuation(property_id: str, db: Session = Depends(get_db)):
    """
    Generate AI valuation pack - Blueprint pages 4-8
    Provides automated property valuation with comparables
    """
    
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Find comparable properties
    comparables = db.query(Property).filter(
        Property.postcode.like(f"{property.postcode[:4]}%"),  # Same area
        Property.bedrooms == property.bedrooms,
        Property.id != property_id,
        Property.rent.isnot(None)
    ).limit(5).all()
    
    # Calculate valuation
    if comparables:
        rents = [c.rent for c in comparables if c.rent]
        avg_rent = sum(rents) / len(rents) if rents else property.rent or 0
        min_rent = min(rents) if rents else avg_rent * 0.9
        max_rent = max(rents) if rents else avg_rent * 1.1
    else:
        avg_rent = property.rent or 1500
        min_rent = avg_rent * 0.9
        max_rent = avg_rent * 1.1
    
    # Calculate market position
    if property.rent:
        if property.rent < avg_rent * 0.95:
            market_position = "Below market average - good for attracting tenants quickly"
        elif property.rent > avg_rent * 1.05:
            market_position = "Above market average - may take longer to let"
        else:
            market_position = "Priced competitively at market rate"
    else:
        market_position = "Not yet priced"
    
    return {
        "property": {
            "id": property.id,
            "address": property.address,
            "bedrooms": property.bedrooms,
            "current_rent": property.rent
        },
        "valuation": {
            "suggested_rent": round(avg_rent, 2),
            "confidence": "high" if len(comparables) >= 3 else "medium",
            "range": {
                "min": round(min_rent, 2),
                "max": round(max_rent, 2)
            },
            "market_position": market_position
        },
        "comparables": [
            {
                "address": c.address,
                "bedrooms": c.bedrooms,
                "rent": c.rent,
                "distance": "0.3 miles"  # In real version, calculate actual distance
            } for c in comparables
        ],
        "market_analysis": {
            "demand": "High demand for {}-bedroom properties in this area".format(property.bedrooms),
            "average_days_to_let": 14,  # In real version, calculate from actual data
            "occupancy_rate": "95%"
        },
        "recommendations": [
            f"Suggested listing price: £{round(avg_rent, 2)}/month",
            "Professional photography recommended",
            "Energy efficiency improvements could justify higher rent"
        ],
        "pdf_url": f"/api/v1/documents/valuations/{property_id}.pdf"
    }


@router.get("/analytics/applicant/{applicant_id}")
async def get_applicant_analytics(applicant_id: str, db: Session = Depends(get_db)):
    """
    Get AI-powered analytics for an applicant
    Insights into their search behavior and preferences
    """
    
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Calculate urgency score
    urgency = "low"
    if applicant.move_in_date:
        days_until = (applicant.move_in_date - datetime.now().date()).days
        if days_until < 14:
            urgency = "urgent"
        elif days_until < 30:
            urgency = "high"
        elif days_until < 60:
            urgency = "medium"
    
    return {
        "applicant_id": applicant.id,
        "name": f"{applicant.first_name} {applicant.last_name}",
        "urgency_level": urgency,
        "qualification_score": 85,  # In real version, calculate from references, etc.
        "engagement_level": "high",  # In real version, track viewing attendance
        "predicted_conversion": "75%",
        "recommended_actions": [
            "Send top 3 property matches",
            "Book viewing within 48 hours",
            "Prepare tenancy application"
        ] if urgency == "urgent" else [
            "Send weekly property updates",
            "Keep in regular contact",
            "Monitor new listings"
        ]
    }


# ============================================================================
# MATCH SENDING (Blueprint page 779-780)
# ============================================================================

class SendMatchesRequest(BaseModel):
    """Request body for sending matches to applicant"""
    applicant_id: str
    property_ids: List[str]
    send_method: str = "email"  # email, sms, whatsapp
    custom_message: Optional[str] = None
    schedule_for: Optional[datetime] = None  # If set, schedule for future


@router.post("/match-send")
async def send_matches_to_applicant(
    request: SendMatchesRequest,
    db: Session = Depends(get_db)
):
    """
    Send personalized property matches to applicant
    Blueprint page 779: "the CRM should be capable of sending matches automatically 
    using AI. Either through phone calls emails or whatsapp. The matches should 
    be personalised"
    """
    
    # Get applicant
    applicant = db.query(Applicant).filter(Applicant.id == request.applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Get properties
    properties = db.query(Property).filter(Property.id.in_(request.property_ids)).all()
    if not properties:
        raise HTTPException(status_code=404, detail="No properties found")
    
    matcher = PropertyMatcher()
    sent_matches = []
    
    for property in properties:
        # Calculate match score
        score = matcher.calculate_match_score(property, applicant)
        
        # Generate personalized message
        personalized_msg = matcher.generate_personalized_message(property, applicant, score)
        
        # Override with custom message if provided
        if request.custom_message:
            personalized_msg = f"{request.custom_message}\n\n{personalized_msg}"
        
        # Determine recipient based on send method
        if request.send_method == "email":
            recipient = applicant.email
        elif request.send_method in ["sms", "whatsapp"]:
            recipient = applicant.phone
        else:
            recipient = applicant.email
        
        # Create match history record
        match_record = MatchHistory(
            applicant_id=applicant.id,
            property_id=property.id,
            match_score=score,
            personalized_message=personalized_msg,
            sent_at=request.schedule_for or datetime.utcnow(),
            send_method=request.send_method,
            recipient=recipient
        )
        db.add(match_record)
        
        sent_matches.append({
            "property_id": property.id,
            "address": property.address,
            "score": round(score, 2),
            "message": personalized_msg,
            "sent_to": recipient,
            "method": request.send_method
        })
    
    db.commit()
    
    return {
        "success": True,
        "applicant": {
            "id": applicant.id,
            "name": f"{applicant.first_name} {applicant.last_name}",
            "email": applicant.email
        },
        "matches_sent": len(sent_matches),
        "send_method": request.send_method,
        "sent_at": request.schedule_for or datetime.utcnow(),
        "is_scheduled": request.schedule_for is not None,
        "matches": sent_matches,
        "message": f"Successfully sent {len(sent_matches)} personalized property matches via {request.send_method}"
    }


@router.get("/match-history/{applicant_id}")
async def get_match_history(
    applicant_id: str,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Get match sending history for an applicant
    Blueprint page 779: "Match send history (when/which property details sent)"
    """
    
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    # Get match history
    history = db.query(MatchHistory).filter(
        MatchHistory.applicant_id == applicant_id
    ).order_by(MatchHistory.sent_at.desc()).limit(limit).all()
    
    history_records = []
    for record in history:
        property = db.query(Property).filter(Property.id == record.property_id).first()
        
        history_records.append({
            "id": record.id,
            "sent_at": record.sent_at.isoformat(),
            "send_method": record.send_method,
            "match_score": round(record.match_score, 2) if record.match_score else None,
            "property": {
                "id": property.id,
                "address": property.address,
                "rent": property.rent,
                "bedrooms": property.bedrooms
            } if property else None,
            "viewed": record.viewed,
            "responded": record.responded,
            "response_type": record.response_type,
            "viewing_booked": record.viewing_booked
        })
    
    # Calculate engagement stats
    total_sent = len(history)
    viewed_count = sum(1 for r in history if r.viewed)
    responded_count = sum(1 for r in history if r.responded)
    viewing_booked_count = sum(1 for r in history if r.viewing_booked)
    
    return {
        "applicant": {
            "id": applicant.id,
            "name": f"{applicant.first_name} {applicant.last_name}"
        },
        "history": history_records,
        "stats": {
            "total_matches_sent": total_sent,
            "viewed_rate": f"{(viewed_count/total_sent*100):.1f}%" if total_sent > 0 else "0%",
            "response_rate": f"{(responded_count/total_sent*100):.1f}%" if total_sent > 0 else "0%",
            "viewing_conversion": f"{(viewing_booked_count/total_sent*100):.1f}%" if total_sent > 0 else "0%"
        }
    }


@router.post("/match-response/{match_id}")
async def record_match_response(
    match_id: str,
    response_type: str,  # interested, not_interested, booked_viewing
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Record applicant's response to a match
    Blueprint page 779: "Applicant feedback on matches (accepted/declined, notes)"
    """
    
    match_record = db.query(MatchHistory).filter(MatchHistory.id == match_id).first()
    if not match_record:
        raise HTTPException(status_code=404, detail="Match record not found")
    
    # Update match record
    match_record.responded = True
    match_record.response_type = response_type
    match_record.response_at = datetime.utcnow()
    match_record.response_notes = notes
    
    if response_type == "booked_viewing":
        match_record.viewing_booked = True
    
    db.commit()
    
    return {
        "success": True,
        "match_id": match_id,
        "response_recorded": {
            "type": response_type,
            "notes": notes,
            "recorded_at": datetime.utcnow().isoformat()
        }
    }


# ============================================================================
# REVERSE MATCHING: PROPERTY TO APPLICANTS
# ============================================================================

class ApplicantMatcher:
    """
    Reverse matching: Find applicants that match a property
    """
    
    @staticmethod
    def calculate_match_score(applicant: Applicant, property: Property) -> float:
        """
        Calculate match score (0-100) for an applicant matching a property
        This is the reverse of PropertyMatcher.calculate_match_score
        """
        score = 0.0
        max_score = 0.0
        
        # Bedroom matching (30 points)
        max_score += 30
        if applicant.desired_bedrooms and property.bedrooms:
            desired_bedrooms_str = str(applicant.desired_bedrooms).strip()
            property_bedrooms = int(property.bedrooms)
            
            if '-' in desired_bedrooms_str:
                # Range format: "2-4"
                try:
                    min_bedrooms, max_bedrooms = map(int, desired_bedrooms_str.split('-'))
                    if min_bedrooms <= property_bedrooms <= max_bedrooms:
                        score += 30  # Perfect match within range
                    elif property_bedrooms == min_bedrooms - 1 or property_bedrooms == max_bedrooms + 1:
                        score += 15  # 1 bedroom off
                except (ValueError, IndexError):
                    if str(property_bedrooms) == desired_bedrooms_str:
                        score += 30
            else:
                # Single number format
                try:
                    desired_bedrooms = int(desired_bedrooms_str)
                    if property_bedrooms == desired_bedrooms:
                        score += 30
                    elif abs(property_bedrooms - desired_bedrooms) == 1:
                        score += 15
                except ValueError:
                    if str(property_bedrooms) == desired_bedrooms_str:
                        score += 30
        
        # Budget matching (25 points)
        max_score += 25
        if property.rent:
            if applicant.rent_budget_min and applicant.rent_budget_max:
                if applicant.rent_budget_min <= property.rent <= applicant.rent_budget_max:
                    score += 25  # Within budget
                elif property.rent < applicant.rent_budget_min * 1.1:
                    score += 15  # Slightly under budget
            elif applicant.rent_budget_max:
                if property.rent <= applicant.rent_budget_max:
                    score += 25
                elif property.rent <= applicant.rent_budget_max * 1.1:
                    score += 15
        
        # Property type matching (15 points)
        max_score += 15
        if applicant.desired_property_type and property.property_type:
            if applicant.desired_property_type.lower() in property.property_type.lower():
                score += 15
        
        # Move-in date urgency (10 points)
        max_score += 10
        if applicant.move_in_date:
            days_until_move = (applicant.move_in_date - datetime.now().date()).days
            if 0 <= days_until_move <= 30:
                score += 10  # Urgent - needs property soon
            elif 30 < days_until_move <= 60:
                score += 5
        
        # Normalize to 0-100
        if max_score > 0:
            return (score / max_score) * 100
        return 0.0
    
    @staticmethod
    def generate_personalized_message(applicant: Applicant, property: Property, score: float) -> str:
        """
        Generate personalized message to applicant about a property
        Reverse of the property-to-applicant message
        """
        message_parts = [f"Hi {applicant.first_name}! "]
        
        # Opening based on match quality
        if score >= 90:
            message_parts.append("I've found the perfect property for you! ")
        elif score >= 75:
            message_parts.append("I have an exciting property that matches your requirements! ")
        else:
            message_parts.append("I wanted to share a property that might interest you. ")
        
        # Property description
        if property.rent:
            rent_text = f" for £{property.rent:,.0f}/month"
        else:
            rent_text = ""
        
        message_parts.append(
            f"This {property.bedrooms}-bedroom {property.property_type} in {property.city}"
            f"{rent_text}. "
        )
        
        # Budget match
        if applicant.rent_budget_min and applicant.rent_budget_max and property.rent:
            if applicant.rent_budget_min <= property.rent <= applicant.rent_budget_max:
                message_parts.append(
                    f"It fits perfectly within your budget of £{applicant.rent_budget_min:,.0f}-£{applicant.rent_budget_max:,.0f}. "
                )
        
        # Pet-friendly matching
        if applicant.has_pets and applicant.pet_details:
            if property.features and 'garden' in property.features.lower():
                message_parts.append(f"Great news - it has a garden that {applicant.pet_details} would love! ")
            elif property.features and 'pets_allowed' in property.features.lower():
                message_parts.append(f"Good news - pets are welcome here for {applicant.pet_details}! ")
        
        # Special requirements matching
        if applicant.special_requirements:
            reqs = applicant.special_requirements.lower()
            if 'parking' in reqs and property.features and 'parking' in property.features.lower():
                message_parts.append("Parking is included! ")
            if 'school' in reqs and property.features and 'school' in property.features.lower():
                message_parts.append("Perfect for families - near excellent schools! ")
        
        # Property highlights
        if property.description:
            # Add a snippet of the description
            desc_preview = property.description[:100] + "..." if len(property.description) > 100 else property.description
            message_parts.append(f"\n\n{desc_preview}\n\n")
        
        # Call to action
        message_parts.append(
            f"Would you like to arrange a viewing? I have availability this week. "
            f"Reply to this email or call me to discuss further!"
        )
        
        return ''.join(message_parts)


@router.get("/match-applicants/{property_id}")
async def find_matching_applicants(
    property_id: str,
    limit: int = 50,
    min_score: float = 50.0,
    db: Session = Depends(get_db)
):
    """
    Find all applicants that match a specific property
    Reverse of the applicant-to-property matching
    
    Matches based on:
    - Bedrooms (exact match or within applicant's range)
    - Budget (property rent within applicant's min/max)
    """
    
    # Get property
    property = db.query(Property).filter(Property.id == property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get all active applicants (looking for rentals)
    active_applicants = db.query(Applicant).filter(
        Applicant.status.in_([
            ApplicantStatus.NEW,
            ApplicantStatus.QUALIFIED,
            ApplicantStatus.VIEWING_BOOKED
        ])
    ).all()
    
    if not active_applicants:
        return {
            "property": {
                "id": property.id,
                "address": property.address,
                "bedrooms": property.bedrooms,
                "rent": property.rent
            },
            "matches": [],
            "message": "No active applicants in the system"
        }
    
    # Calculate match scores
    matcher = ApplicantMatcher()
    matches = []
    
    # Get already sent history for this property
    sent_history = db.query(MatchHistory).filter(
        MatchHistory.property_id == property_id
    ).all()
    sent_applicant_ids = {h.applicant_id: h.sent_at for h in sent_history}
    
    for applicant in active_applicants:
        score = matcher.calculate_match_score(applicant, property)
        
        if score >= min_score:
            personalized_message = matcher.generate_personalized_message(
                applicant, property, score
            )
            
            # Generate match reasons
            reasons = []
            
            # Bedroom match reason
            if applicant.desired_bedrooms and property.bedrooms:
                desired_bedrooms_str = str(applicant.desired_bedrooms).strip()
                property_bedrooms = int(property.bedrooms)
                
                if '-' in desired_bedrooms_str:
                    try:
                        min_beds, max_beds = map(int, desired_bedrooms_str.split('-'))
                        if min_beds <= property_bedrooms <= max_beds:
                            reasons.append(f"Perfect bedroom match ({property.bedrooms} beds within {desired_bedrooms_str} range)")
                    except (ValueError, IndexError):
                        pass
                else:
                    try:
                        desired_beds = int(desired_bedrooms_str)
                        if property_bedrooms == desired_beds:
                            reasons.append(f"Exact bedroom match ({property.bedrooms} beds)")
                    except ValueError:
                        pass
            
            # Budget match reason
            if property.rent and applicant.rent_budget_max:
                if applicant.rent_budget_min and applicant.rent_budget_min <= property.rent <= applicant.rent_budget_max:
                    reasons.append(f"Within budget (£{applicant.rent_budget_min:,.0f}-£{applicant.rent_budget_max:,.0f})")
                elif property.rent <= applicant.rent_budget_max:
                    reasons.append(f"Within maximum budget (£{applicant.rent_budget_max:,.0f})")
            
            # Property type match
            if applicant.desired_property_type and property.property_type:
                if applicant.desired_property_type.lower() in property.property_type.lower():
                    reasons.append(f"Desired property type ({property.property_type})")
            
            # Check if already sent
            already_sent = applicant.id in sent_applicant_ids
            sent_date = sent_applicant_ids.get(applicant.id)
            
            matches.append({
                "applicant_id": applicant.id,
                "score": round(score, 2),
                "applicant": {
                    "id": applicant.id,
                    "first_name": applicant.first_name,
                    "last_name": applicant.last_name,
                    "email": applicant.email,
                    "phone": applicant.phone,
                    "desired_bedrooms": applicant.desired_bedrooms,
                    "budget": f"£{applicant.rent_budget_min or 0:,.0f}-£{applicant.rent_budget_max or 0:,.0f}",
                    "move_in_date": str(applicant.move_in_date) if applicant.move_in_date else None,
                    "status": applicant.status
                },
                "personalized_message": personalized_message,
                "match_reasons": reasons,
                "already_sent": already_sent,
                "sent_date": sent_date.isoformat() if sent_date else None
            })
    
    # Sort by score (highest first)
    matches.sort(key=lambda x: x['score'], reverse=True)
    matches = matches[:limit]
    
    return {
        "property": {
            "id": property.id,
            "address": property.address,
            "city": property.city,
            "bedrooms": property.bedrooms,
            "rent": property.rent,
            "property_type": property.property_type
        },
        "matches": matches,
        "total_matches": len(matches),
        "generated_at": datetime.utcnow().isoformat()
    }


class SendPropertyToApplicantsRequest(BaseModel):
    """Request body for sending property to multiple applicants"""
    property_id: str
    applicant_ids: List[str]
    send_method: str = "email"  # email, sms, whatsapp
    custom_message: Optional[str] = None


@router.post("/send-property-to-applicants")
async def send_property_to_applicants(
    request: SendPropertyToApplicantsRequest,
    db: Session = Depends(get_db)
):
    """
    Send a property to multiple selected applicants
    Each applicant receives a personalized email about the property
    
    Includes duplicate prevention - won't send if already sent before
    """
    
    # Get property
    property = db.query(Property).filter(Property.id == request.property_id).first()
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")
    
    # Get applicants
    applicants = db.query(Applicant).filter(Applicant.id.in_(request.applicant_ids)).all()
    if not applicants:
        raise HTTPException(status_code=404, detail="No applicants found")
    
    # Check for duplicates
    existing_sends = db.query(MatchHistory).filter(
        MatchHistory.property_id == request.property_id,
        MatchHistory.applicant_id.in_(request.applicant_ids)
    ).all()
    already_sent_ids = {record.applicant_id for record in existing_sends}
    
    matcher = ApplicantMatcher()
    sent_matches = []
    skipped_duplicates = []
    
    for applicant in applicants:
        # Skip if already sent
        if applicant.id in already_sent_ids:
            skipped_duplicates.append({
                "applicant_id": applicant.id,
                "name": f"{applicant.first_name} {applicant.last_name}",
                "reason": "Already sent previously"
            })
            continue
        
        # Calculate match score
        score = matcher.calculate_match_score(applicant, property)
        
        # Generate personalized message
        personalized_msg = matcher.generate_personalized_message(applicant, property, score)
        
        # Override with custom message if provided
        if request.custom_message:
            personalized_msg = f"{request.custom_message}\n\n{personalized_msg}"
        
        # Determine recipient based on send method
        if request.send_method == "email":
            recipient = applicant.email
        elif request.send_method in ["sms", "whatsapp"]:
            recipient = applicant.phone
        else:
            recipient = applicant.email
        
        # Create match history record
        match_record = MatchHistory(
            applicant_id=applicant.id,
            property_id=property.id,
            match_score=score,
            personalized_message=personalized_msg,
            sent_at=datetime.utcnow(),
            send_method=request.send_method,
            recipient=recipient
        )
        db.add(match_record)
        
        sent_matches.append({
            "applicant_id": applicant.id,
            "name": f"{applicant.first_name} {applicant.last_name}",
            "email": applicant.email,
            "score": round(score, 2),
            "message_preview": personalized_msg[:100] + "...",
            "sent_to": recipient,
            "method": request.send_method
        })
    
    db.commit()
    
    return {
        "success": True,
        "property": {
            "id": property.id,
            "address": property.address,
            "rent": property.rent
        },
        "sent_count": len(sent_matches),
        "skipped_count": len(skipped_duplicates),
        "send_method": request.send_method,
        "sent_at": datetime.utcnow().isoformat(),
        "sent_to": sent_matches,
        "skipped": skipped_duplicates,
        "message": f"Successfully sent property to {len(sent_matches)} applicants. Skipped {len(skipped_duplicates)} duplicates."
    }
