# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    JWTError,
    TokenData,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_password_hash,
    jwt,
    settings,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RefreshTokenRequest, Token
from app.schemas.user import UserCreate, UserRead


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
            detail="An account with this email already exists.",
        )

    hashed_password = get_password_hash(user.password)

    # Convert UUIDs to strings for the model
    user_data = user.model_dump(exclude={"password"})
    user_data["organization_id"] = str(user.organization_id)
    if user.branch_id:
        user_data["branch_id"] = str(user.branch_id)

    db_user = User(**user_data, hashed_password=hashed_password)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


@router.post("/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    token_data = {"sub": user.email}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return Token(access_token=access_token, refresh_token=refresh_token)


# ... (token refresh and /me endpoints are unchanged from before) ...


@router.post("/token", response_model=Token)
def refresh_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(sub=email)
    except JWTError:
        raise credentials_exception from None

    user = db.query(User).filter(User.email == token_data.sub).first()

    if user is None:
        raise credentials_exception

    new_token_data = {"sub": user.email}
    new_access_token = create_access_token(data=new_token_data)
    new_refresh_token = create_refresh_token(data=new_token_data)

    return Token(access_token=new_access_token, refresh_token=new_refresh_token)


@router.get("/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
