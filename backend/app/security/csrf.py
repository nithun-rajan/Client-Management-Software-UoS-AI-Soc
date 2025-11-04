"""
CSRF Protection

Provides CSRF (Cross-Site Request Forgery) protection for state-changing operations.
Uses double-submit cookie pattern for stateless CSRF protection.
"""

import hashlib
import hmac
import secrets

from fastapi import Header, HTTPException, Request, status


class CSRFProtection:
    """
    CSRF protection using double-submit cookie pattern.

    For stateless CSRF protection, we use a signed token approach:
    1. Generate a random token
    2. Sign it with a secret key
    3. Send it as both cookie and require it in request header
    """

    def __init__(self, secret_key: str, cookie_name: str = "csrf_token"):
        """
        Initialize CSRF protection.

        Args:
            secret_key: Secret key for signing tokens
            cookie_name: Name of CSRF cookie
        """
        self.secret_key = secret_key.encode()
        self.cookie_name = cookie_name
        self.header_name = "X-CSRF-Token"

    def generate_token(self) -> str:
        """
        Generate a new CSRF token.

        Returns:
            CSRF token string
        """
        # Generate random token
        random_token = secrets.token_urlsafe(32)

        # Sign the token
        signature = hmac.new(
            self.secret_key,
            random_token.encode(),
            hashlib.sha256,
        ).hexdigest()

        # Return token with signature
        return f"{random_token}.{signature}"

    def verify_token(self, token: str) -> bool:
        """
        Verify CSRF token is valid.

        Args:
            token: Token to verify

        Returns:
            True if valid, False otherwise
        """
        if not token:
            return False

        try:
            # Split token and signature
            random_token, signature = token.rsplit(".", 1)

            # Compute expected signature
            expected_signature = hmac.new(
                self.secret_key,
                random_token.encode(),
                hashlib.sha256,
            ).hexdigest()

            # Constant-time comparison to prevent timing attacks
            return hmac.compare_digest(signature, expected_signature)

        except (ValueError, AttributeError):
            return False

    async def validate_csrf(
        self,
        request: Request,
        csrf_token: str | None = Header(None, alias="X-CSRF-Token"),
    ) -> None:
        """
        Validate CSRF token from request.

        This should be used as a dependency on state-changing endpoints (POST, PUT, DELETE).

        Args:
            request: FastAPI request object
            csrf_token: CSRF token from header

        Raises:
            HTTPException: If CSRF token is missing or invalid
        """
        # Skip CSRF check for safe methods
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return

        # Get token from cookie
        cookie_token = request.cookies.get(self.cookie_name)

        # Validate both tokens exist and match
        if not csrf_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing in header",
            )

        if not cookie_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token missing in cookie",
            )

        if not self.verify_token(csrf_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid CSRF token",
            )

        if csrf_token != cookie_token:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token mismatch",
            )


def get_csrf_protection(secret_key: str) -> CSRFProtection:
    """
    Get CSRF protection instance.

    Args:
        secret_key: Secret key for signing tokens

    Returns:
        CSRFProtection instance
    """
    return CSRFProtection(secret_key=secret_key)
