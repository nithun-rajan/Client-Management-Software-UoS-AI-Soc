# app/schemas/auth.py
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    sub: EmailStr | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str
