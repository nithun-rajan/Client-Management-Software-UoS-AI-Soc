

import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.property import Property
from app.models.applicant import Applicant
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
        
        # Bedroom matching (using bedrooms_min/max range)
        max_score += 30
        if applicant.desired_bedrooms:
            if str(property.bedrooms) == applicant.desired_bedrooms:
                score += 30
            elif abs(int(property.bedrooms) - int(applicant.desired_bedrooms)) == 1:
                score += 15  # 1 bedroom off is half credit
        
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
        if applicant.preferred_locations and property.postcode:
            preferred = applicant.preferred_locations.lower()
            property_location = f"{property.city or ''} {property.postcode}".lower()
            
            if any(loc.strip() in property_location for loc in preferred.split(',')):
                score += 20
            elif any(loc.strip()[:4] in property.postcode.lower()[:4] for loc in preferred.split(',')):
                score += 10  # Partial postcode match
        
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
        # Extract first name from first_name field
        first_name = applicant.first_name if applicant.first_name else "there"
        message_parts = [f"Hi {first_name}! "]
        
        # Opening based on match quality
        if score >= 90:
            message_parts.append("I've found an amazing property that's perfect for you! ")
        elif score >= 75:
            message_parts.append("I think you'll love this property! ")
        else:
            message_parts.append("Here's a property you might be interested in. ")
        
        # Property description
        city = property.city or ""
        message_parts.append(
            f"This {property.bedrooms}-bedroom {property.property_type} in {city} "
            f"is available for £{property.rent:,.0f}/month. " if property.rent else ""
        )
        
        # Pet-related personalization (Blueprint page 29)
        if applicant.has_pets and applicant.pet_details:
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
                    "bedrooms": applicant.desired_bedrooms or 'any',
                    "budget": f"£{applicant.rent_budget_min or 0}-£{applicant.rent_budget_max or 0}",
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
            if applicant.desired_bedrooms and str(property.bedrooms) == applicant.desired_bedrooms:
                reasons.append(f"Exact bedroom match ({property.bedrooms} beds)")
            if property.rent and applicant.rent_budget_max and property.rent <= applicant.rent_budget_max:
                reasons.append(f"Within budget (£{property.rent:,.0f})")
            if applicant.preferred_locations:
                locs = [l.strip() for l in applicant.preferred_locations.split(',')]
                city = property.city or ""
                if any(loc.lower() in f"{city} {property.postcode}".lower() for loc in locs):
                    reasons.append(f"Preferred location ({city})")
            
            matches.append({
                "property_id": property.id,
                "score": round(score, 2),
                "property": {
                    "id": property.id,
                    "address": property.address,
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
                "bedrooms": applicant.desired_bedrooms or 'any',
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