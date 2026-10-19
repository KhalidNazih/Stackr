from fastapi import APIRouter, HTTPException, Header, Cookie, Depends
from pydantic import BaseModel
import httpx
from config import settings
from typing import Optional

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class CallbackRequest(BaseModel):
    code: str
    redirect_uri: str


@router.post("/callback")
async def auth_callback(body: CallbackRequest):
    token_url = f"{settings.KEYCLOAK_INTERNAL_URL.rstrip('/')}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
    async with httpx.AsyncClient(verify=False) as client:
        try:
            resp = await client.post(token_url, data={
                "grant_type": "authorization_code",
                "client_id": settings.KEYCLOAK_CLIENT_ID,
                "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
                "code": body.code,
                "redirect_uri": body.redirect_uri,
            })
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Keycloak callback: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            logger.error(f"Connection error to Keycloak: {e}")
            raise HTTPException(status_code=500, detail="Internal Keycloak Connection Error")
    return resp.json()


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    token_url = f"{settings.KEYCLOAK_INTERNAL_URL.rstrip('/')}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
    async with httpx.AsyncClient(verify=False) as client:
        try:
            resp = await client.post(token_url, data={
                "grant_type": "refresh_token",
                "client_id": settings.KEYCLOAK_CLIENT_ID,
                "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
                "refresh_token": refresh_token,
            })
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error from Keycloak refresh: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
        except Exception as e:
            logger.error(f"Connection error to Keycloak refresh: {e}")
            raise HTTPException(status_code=500, detail="Internal Keycloak Connection Error")
    return resp.json()


async def _userinfo(token: str) -> Optional[dict]:
    base = settings.KEYCLOAK_INTERNAL_URL.rstrip("/")
    url = f"{base}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/userinfo"
    try:
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error from Keycloak _userinfo: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Connection error to Keycloak _userinfo: {e}")
        return None
    return resp.json()


async def get_current_user_email(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    access_token: Optional[str] = Cookie(None, alias="access_token"),
    dev_auth: Optional[str] = Cookie(None, alias="dev_auth"),
) -> str:
    token: Optional[str] = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif access_token:
        token = access_token.strip()

    email: Optional[str] = None
    if token:
        info = await _userinfo(token)
        if info:
            email = info.get("email")
    if not email and dev_auth and settings.ALLOW_DEV_AUTH_BYPASS:
        email = dev_auth.strip()

    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return email
