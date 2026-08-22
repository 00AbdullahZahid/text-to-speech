"""FastAPI dependencies — shared across all routers."""
from __future__ import annotations

import os
from typing import Annotated

import jwt
from dotenv import load_dotenv
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient

load_dotenv()

_JWKS_URL = os.getenv("SUPABASE_JWKS_URL", "")
_jwk_client = PyJWKClient(_JWKS_URL) if _JWKS_URL else None


def get_current_user(authorization: str = Header(...)) -> str:
    """Verify the Supabase JWT and return the user's UUID (``sub``).

    Raises 401 when the token is missing, malformed, or expired.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.removeprefix("Bearer ")

    if _jwk_client is None:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_JWKS_URL is not configured",
        )

    try:
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Token missing subject")

    return sub


UserId = Annotated[str, Depends(get_current_user)]
