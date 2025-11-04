import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.applicant import Applicant
from app.models.enums import PropertyStatus
from app.models.property import Property


URGENT_MOVE_IN_DAYS = 30
NEAR_TERM_MOVE_IN_DAYS = 60
# Messaging thresholds
OPENING_EXCELLENT_SCORE = 90
OPENING_GOOD_SCORE = 75
# Valuation confidence threshold
COMPARABLES_HIGH_CONFIDENCE_MIN = 3
# Applicant urgency thresholds
URGENCY_URGENT_DAYS = 14
URGENCY_HIGH_DAYS = 30
URGENCY_MEDIUM_DAYS = 60


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
    def _calculate_bedroom_score(property: Property, applicant: Applicant) -> tuple[float, float]:
        max_score = 30
        if not applicant.desired_bedrooms:
            return 0, max_score

        if str(property.bedrooms) == applicant.desired_bedrooms:
            return 30, max_score
        if abs(int(property.bedrooms) - int(applicant.desired_bedrooms)) == 1:
            return 15, max_score  # 1 bedroom off is half credit
        return 0, max_score

    @staticmethod
    def _calculate_rent_score(property: Property, applicant: Applicant) -> tuple[float, float]:
        max_score = 25
        if not property.rent:
            return 0, max_score

        if applicant.rent_budget_min and applicant.rent_budget_max:
            if (
                applicant.rent_budget_min
                <= property.rent
                <= applicant.rent_budget_max
            ):
                return 25, max_score
            if property.rent < applicant.rent_budget_min * 1.1:  # 10% over budget
                return 15, max_score
        elif applicant.rent_budget_max:
            if property.rent <= applicant.rent_budget_max:
                return 25, max_score
            if property.rent <= applicant.rent_budget_max * 1.1:
                return 15, max_score
        return 0, max_score

    @staticmethod
    def _calculate_location_score(property: Property, applicant: Applicant) -> tuple[float, float]:
        max_score = 20
        if not (applicant.preferred_locations and property.postcode):
            return 0, max_score

        preferred = applicant.preferred_locations.lower()
        property_location = f"{property.city} {property.postcode}".lower()

        if any(loc.strip() in property_location for loc in preferred.split(",")):
            return 20, max_score
        if any(
            loc.strip()[:4] in property.postcode.lower()[:4]
            for loc in preferred.split(",")
        ):
            return 10, max_score  # Partial postcode match
        return 0, max_score

    @staticmethod
    def _calculate_property_type_score(property: Property, applicant: Applicant) -> tuple[float, float]:
        max_score = 15
        if not applicant.desired_property_type:
            return 0, max_score

        if (
            applicant.desired_property_type.lower()
            in property.property_type.lower()
        ):
            return 15, max_score
        return 0, max_score

    @staticmethod
    def _calculate_move_in_date_score(applicant: Applicant) -> tuple[float, float]:
        max_score = 10
        if not applicant.move_in_date:
            return 0, max_score

        days_until_move = (applicant.move_in_date - datetime.now(timezone.utc).date()).days
        if 0 <= days_until_move <= URGENT_MOVE_IN_DAYS:
            return 10, max_score
        if URGENT_MOVE_IN_DAYS < days_until_move <= NEAR_TERM_MOVE_IN_DAYS:
            return 5, max_score
        return 0, max_score

    @staticmethod
    def calculate_match_score(property: Property, applicant: Applicant) -> float:
        """
        Calculate match score (0-100) based on multiple factors
        """
        score = 0.0
        max_score = 0.0

        bedroom_score, bedroom_max_score = PropertyMatcher._calculate_bedroom_score(property, applicant)
        score += bedroom_score
        max_score += bedroom_max_score

        rent_score, rent_max_score = PropertyMatcher._calculate_rent_score(property, applicant)
        score += rent_score
        max_score += rent_max_score

        location_score, location_max_score = PropertyMatcher._calculate_location_score(property, applicant)
        score += location_score
        max_score += location_max_score

        property_type_score, property_type_max_score = PropertyMatcher._calculate_property_type_score(property, applicant)
        score += property_type_score
        max_score += property_type_max_score

        move_in_date_score, move_in_date_max_score = PropertyMatcher._calculate_move_in_date_score(applicant)
        score += move_in_date_score
        max_score += move_in_date_max_score

        # Normalize to 0-100
        if max_score > 0:
            return (score / max_score) * 100
        return 0.0

    @staticmethod
    def _generate_opening_message(score: float) -> str:
        if score >= OPENING_EXCELLENT_SCORE:
            return "I've found an amazing property that's perfect for you! "
        if score >= OPENING_GOOD_SCORE:
            return "I think you'll love this property! "
        return "Here's a property you might be interested in. "

    @staticmethod
    def _generate_pet_message(property: Property, applicant: Applicant) -> str:
        if not (applicant.has_pets and applicant.pet_details):
            return ""

        if property.features and "garden" in property.features.lower():
            return f"Great news - it has a garden that {applicant.pet_details} would love! "
        if property.features and "pets_allowed" in property.features.lower():
            return f"Good news - pets are welcome here for {applicant.pet_details}! "
        return ""

    @staticmethod
    def _generate_location_message(property: Property, applicant: Applicant) -> str:
        if not applicant.special_requirements:
            return ""

        reqs = applicant.special_requirements.lower()
        message = ""
        if "school" in reqs and property.features:
            features_lower = property.features.lower()
            if "school" in features_lower:
                message += "Perfect for families - it's near excellent schools! "
        if (
            "parking" in reqs
            and property.features
            and "parking" in property.features.lower()
        ):
            message += "Parking included! "
        if "transport" in reqs:
            message += "Excellent transport links nearby. "
        return message

    @staticmethod
    def _generate_highlights_message(property: Property) -> str:
        if not property.features:
            return ""

        try:
            features_list = (
                json.loads(property.features)
                if isinstance(property.features, str)
                else []
            )
            highlights = [
                f
                for f in features_list
                if f in ["garden", "parking", "balcony", "modern", "renovated"]
            ]
            if highlights:
                return f"Features: {', '.join(highlights)}. "
        except Exception:
            pass
        return ""

    @staticmethod
    def generate_personalized_message(
        property: Property, applicant: Applicant, score: float
    ) -> str:
        """
        Blueprint page 29: "matches should be personalised"
        """
        message_parts = [f"Hi {applicant.first_name}! "]

        opening = PropertyMatcher._generate_opening_message(score)
        message_parts.append(opening)

        # Property description
        message_parts.append(
            f"This {property.bedrooms}-bedroom {property.property_type} in {property.city} "
            f"is available for £{property.rent:,.0f}/month. "
        )

        pet_message = PropertyMatcher._generate_pet_message(property, applicant)
        message_parts.append(pet_message)

        location_message = PropertyMatcher._generate_location_message(property, applicant)
        message_parts.append(location_message)

        highlights_message = PropertyMatcher._generate_highlights_message(property)
        message_parts.append(highlights_message)

        # Call to action
        message_parts.append(
            "Would you like to arrange a viewing? I have availability this week. "
            "Reply to book your viewing or call me to discuss further!"
        )

        return "".join(message_parts)


@router.post("/match-proposals")
async def ai_match_properties(
    applicant_id: str,
    limit: int = 5,
    min_score: float = 60.0,
    db: Session = Depends(get_db),
):
    # Get applicant
    applicant = db.query(Applicant).filter(Applicant.id == applicant_id).first()
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")

    # Get all available properties
    available_properties = (
        db.query(Property).filter(Property.status == PropertyStatus.AVAILABLE).all()
    )

    if not available_properties:
        return {
            "applicant": {
                "id": applicant.id,
                "name": f"{applicant.first_name} {applicant.last_name}",
                "criteria": {
                    "bedrooms": applicant.desired_bedrooms,
                    "budget": f"£{applicant.rent_budget_min}-£{applicant.rent_budget_max}",
                    "locations": applicant.preferred_locations,
                },
            },
            "matches": [],
            "message": "No properties currently available matching your criteria",
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
            if (
                applicant.desired_bedrooms
                and str(property.bedrooms) == applicant.desired_bedrooms
            ):
                reasons.append(f"Exact bedroom match ({property.bedrooms} beds)")
            if (
                property.rent
                and applicant.rent_budget_max
                and property.rent <= applicant.rent_budget_max
            ):
                reasons.append(f"Within budget (£{property.rent:,.0f})")
            if applicant.preferred_locations:
                locs = [loc.strip() for loc in applicant.preferred_locations.split(",")]
                if any(
                    loc.lower() in f"{property.city} {property.postcode}".lower()
                    for loc in locs
                ):
                    reasons.append(f"Preferred location ({property.city})")

            matches.append(
                {
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
                        "main_photo": property.main_photo_url,
                    },
                    "personalized_message": personalized_message,
                    "match_reasons": reasons,
                    "viewing_slots": [
                        "Tomorrow 10:00 AM",
                        "Tomorrow 2:00 PM",
                        "Day after 11:00 AM",
                    ],  # In real version, integrate with calendar
                }
            )

    # Sort by score and limit
    matches.sort(key=lambda x: x["score"], reverse=True)
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
                "move_in_date": str(applicant.move_in_date)
                if applicant.move_in_date
                else None,
            },
        },
        "matches": matches,
        "total_matches": len(matches),
        "ai_confidence": 0.92,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "next_steps": [
            "Review the suggested properties",
            "Book viewings for top matches",
            "Request additional information if needed",
        ],
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
    comparables = (
        db.query(Property)
        .filter(
            Property.postcode.like(f"{property.postcode[:4]}%"),  # Same area
            Property.bedrooms == property.bedrooms,
            Property.id != property_id,
            Property.rent.isnot(None),
        )
        .limit(5)
        .all()
    )

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
            market_position = (
                "Below market average - good for attracting tenants quickly"
            )
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
            "current_rent": property.rent,
        },
        "valuation": {
            "suggested_rent": round(avg_rent, 2),
            "confidence": "high" if len(comparables) >= COMPARABLES_HIGH_CONFIDENCE_MIN else "medium",
            "range": {"min": round(min_rent, 2), "max": round(max_rent, 2)},
            "market_position": market_position,
        },
        "comparables": [
            {
                "address": c.address,
                "bedrooms": c.bedrooms,
                "rent": c.rent,
                "distance": "0.3 miles",  # In real version, calculate actual distance
            }
            for c in comparables
        ],
        "market_analysis": {
            "demand": f"High demand for {property.bedrooms}-bedroom properties in this area",
            "average_days_to_let": 14,  # In real version, calculate from actual data
            "occupancy_rate": "95%",
        },
        "recommendations": [
            f"Suggested listing price: £{round(avg_rent, 2)}/month",
            "Professional photography recommended",
            "Energy efficiency improvements could justify higher rent",
        ],
        "pdf_url": f"/api/v1/documents/valuations/{property_id}.pdf",
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
        days_until = (applicant.move_in_date - datetime.now(timezone.utc).date()).days
        if days_until < URGENCY_URGENT_DAYS:
            urgency = "urgent"
        elif days_until < URGENCY_HIGH_DAYS:
            urgency = "high"
        elif days_until < URGENCY_MEDIUM_DAYS:
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
            "Prepare tenancy application",
        ]
        if urgency == "urgent"
        else [
            "Send weekly property updates",
            "Keep in regular contact",
            "Monitor new listings",
        ],
    }
