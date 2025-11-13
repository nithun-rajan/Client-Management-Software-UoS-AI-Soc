# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.property import Property
from app.models.applicant import Applicant
from app.models.landlord import Landlord
from app.models.vendor import Vendor
from app.schemas.user import UserCreate, UserRead, AgentProfileUpdate
from app.schemas.auth import Token, RefreshTokenRequest
from app.api.v1.agents import ManagedEntity, AgentManagedEntities
from app.core.security import (
    get_password_hash, create_access_token, create_refresh_token,
    verify_password, get_current_user,
    jwt, settings, JWTError, TokenData
)
from typing import Optional
from app.core.database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_new_user(user: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.
    """
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed_password = get_password_hash(user.password)

    # Convert UUIDs to strings for the model
    user_data = user.model_dump(exclude={"password"})
    user_data["organization_id"] = str(user.organization_id)
    if user.branch_id:
        user_data["branch_id"] = str(user.branch_id)

    db_user = User(
        **user_data,
        hashed_password=hashed_password
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=Token)
def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """
    Logs in a user and returns JWT tokens.
    'username' field is the user's email.
    """
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    token_data = {"sub": user.email}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return Token(access_token=access_token, refresh_token=refresh_token)


# ... (token refresh and /me endpoints are unchanged from before) ...

@router.post("/token", response_model=Token)
def refresh_access_token(
        request: RefreshTokenRequest,
        db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(sub=email)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.sub).first()

    if user is None:
        raise credentials_exception

    new_token_data = {"sub": user.email}
    new_access_token = create_access_token(data=new_token_data)
    new_refresh_token = create_refresh_token(data=new_token_data)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current user with agent profile"""
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "organization_id": current_user.organization_id,
        "branch_id": current_user.branch_id,
        "agent_profile": current_user.agent_profile,
    }
    return user_dict


@router.get("/me/profile", response_model=dict)
def get_agent_profile(current_user: User = Depends(get_current_user)):
    """Get current user's agent profile"""
    return current_user.agent_profile or {}


@router.put("/me/profile", response_model=dict)
def update_agent_profile(
    profile: AgentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's agent profile"""
    # Convert profile to dict, excluding None values
    profile_dict = profile.model_dump(exclude_unset=True, exclude_none=True)
    
    # Merge with existing profile
    existing_profile = current_user.agent_profile or {}
    updated_profile = {**existing_profile, **profile_dict}
    
    # Update user
    current_user.agent_profile = updated_profile
    db.commit()
    db.refresh(current_user)
    
    return updated_profile


@router.get("/me/managed", response_model=AgentManagedEntities)
def get_my_managed_entities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all entities (vendors, buyers, landlords, applicants, properties) managed by the current user"""
    result = AgentManagedEntities()
    
    # Get vendors managed by this user
    vendors = db.query(Vendor).filter(Vendor.managed_by == current_user.id).all()
    for vendor in vendors:
        property_count = db.query(Property).filter(Property.vendor_id == vendor.id).count()
        result.vendors.append(ManagedEntity(
            id=vendor.id,
            name=f"{vendor.first_name} {vendor.last_name}".strip(),
            property_count=property_count
        ))
    
    # Get buyers (applicants with buyer_type or willing_to_buy) managed by this user
    buyers = db.query(Applicant).filter(
        Applicant.assigned_agent_id == current_user.id,
        (
            (Applicant.buyer_type.isnot(None)) |
            (Applicant.willing_to_buy == True)
        )
    ).all()
    for buyer in buyers:
        result.buyers.append(ManagedEntity(
            id=buyer.id,
            name=f"{buyer.first_name} {buyer.last_name}".strip(),
            property_count=0
        ))
    
    # Get landlords managed by this user
    landlords = db.query(Landlord).filter(Landlord.managed_by == current_user.id).all()
    for landlord in landlords:
        property_count = db.query(Property).filter(Property.landlord_id == landlord.id).count()
        result.landlords.append(ManagedEntity(
            id=landlord.id,
            name=landlord.full_name,
            property_count=property_count
        ))
    
    # Get applicants/tenants (willing to rent, not buyers) managed by this user
    applicants = db.query(Applicant).filter(
        Applicant.assigned_agent_id == current_user.id,
        Applicant.willing_to_rent == True,
        Applicant.buyer_type.is_(None)  # Not a buyer
    ).all()
    for applicant in applicants:
        result.applicants.append(ManagedEntity(
            id=applicant.id,
            name=f"{applicant.first_name} {applicant.last_name}".strip(),
            property_count=0
        ))
    
    # Get properties managed by this user (through landlord or vendor)
    landlord_ids = [l.id for l in landlords]
    vendor_ids = [v.id for v in vendors]
    
    properties = []
    if landlord_ids:
        landlord_properties = db.query(Property).filter(Property.landlord_id.in_(landlord_ids)).all()
        properties.extend(landlord_properties)
    if vendor_ids:
        vendor_properties = db.query(Property).filter(Property.vendor_id.in_(vendor_ids)).all()
        properties.extend(vendor_properties)
    
    # Remove duplicates
    seen_property_ids = set()
    for prop in properties:
        if prop.id not in seen_property_ids:
            seen_property_ids.add(prop.id)
            address = prop.address_line1 or prop.address or prop.city or "Unknown"
            result.properties.append(ManagedEntity(
                id=prop.id,
                name=address,
                property_count=0
            ))
    
    return result

@router.get("/users", response_model=list[UserRead])
def list_users(
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all active users, optionally filtered by role.
    """
    from app.schemas.user import Role
    
    query = db.query(User).filter(User.is_active == True)
    
    # Filter by role if provided
    if role:
        try:
            # Validate role enum
            role_enum = Role(role)
            query = query.filter(User.role == role_enum)
        except ValueError:
            # Invalid role, return empty list
            return []
    
    users = query.order_by(User.first_name, User.last_name).offset(skip).limit(limit).all()
    return users