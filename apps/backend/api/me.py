"""
/api/me — Returns the current user's identity + role + tenant access.

Resolves identity in this order:
  1. Authorization: Bearer <keycloak_jwt>     → validated via Keycloak userinfo
  2. Cookie: access_token=<keycloak_jwt>      → same as above (set by SSO callback)
  3. Cookie: dev_auth=<email>                 → development bypass (no Keycloak)

Determines role by:
  - Looking up the email in platform_users; if role='admin' and enabled → super admin
  - Parsing Keycloak groups: '/customer-01-admins' → admin of customer-01,
                              '/customer-01-users'  → user of customer-01
"""
from typing import Optional
import httpx
from fastapi import APIRouter, Cookie, Header, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from config import settings
from db.session import get_db
from db.models import PlatformUser

router = APIRouter(prefix="/api", tags=["me"])


async def _get_keycloak_user(email: str) -> Optional[dict]:
    try:
        from api.keycloak import _admin_token, BASE
        token = await _admin_token()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.get(
                f"{BASE}/users",
                params={"email": email, "exact": "true"},
                headers={"Authorization": f"Bearer {token}"},
            )
            users = resp.json() if resp.status_code == 200 else []
            if not users:
                resp = await client.get(
                    f"{BASE}/users",
                    params={"username": email, "exact": "true"},
                    headers={"Authorization": f"Bearer {token}"},
                )
                users = resp.json() if resp.status_code == 200 else []
            
            if users:
                uid = users[0]["id"]
                detail_resp = await client.get(
                    f"{BASE}/users/{uid}",
                    headers={"Authorization": f"Bearer {token}"},
                )
                if detail_resp.status_code == 200:
                    return detail_resp.json()
                return users[0]
    except Exception as e:
        print(f"Error fetching keycloak user: {e}")
    return None


async def _userinfo(token: str) -> Optional[dict]:
    """Validate Keycloak token by fetching /userinfo. Returns claims dict or None."""
    base = settings.KEYCLOAK_INTERNAL_URL.rstrip("/")
    url = f"{base}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/userinfo"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
    except Exception:
        return None
    if resp.status_code != 200:
        return None
    return resp.json()


def _parse_tenant_access(groups: list[str]) -> dict[str, str]:
    """
    Map Keycloak groups → {tenant_id: 'admin' | 'user'}.
      '/customer-01-admins' → {'customer-01': 'admin'}
      '/customer-01-users'  → {'customer-01': 'user'}
    Admin wins if both groups present.
    """
    access: dict[str, str] = {}
    for raw in groups or []:
        name = raw.lstrip("/")
        if name.endswith("-admins"):
            tid = name[: -len("-admins")]
            access[tid] = "admin"
        elif name.endswith("-users"):
            tid = name[: -len("-users")]
            access.setdefault(tid, "user")
    return access


@router.get("/me")
async def get_me(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    access_token: Optional[str] = Cookie(None, alias="access_token"),
    dev_auth: Optional[str] = Cookie(None, alias="dev_auth"),
    db: AsyncSession = Depends(get_db),
):
    # ── Extract Keycloak token from header or cookie ─────────────────────────
    token: Optional[str] = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif access_token:
        token = access_token.strip()

    email: Optional[str] = None
    name: Optional[str] = None
    groups: list[str] = []
    auth_source = "none"

    if token:
        info = await _userinfo(token)
        if info:
            email = info.get("email")
            name = info.get("name") or info.get("preferred_username") or email
            groups = info.get("groups", []) or []
            auth_source = "keycloak"

    # ── Dev bypass fallback ──────────────────────────────────────────────────
    if not email and dev_auth:
        email = dev_auth.strip()
        name = email.split("@")[0].replace(".", " ").title()
        auth_source = "dev_auth"

    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # ── Look up platform_users row (source of truth for super-admin) ─────────
    stmt = select(PlatformUser).where(PlatformUser.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    is_super_admin = user is not None and user.role == "admin" and user.enabled
    tenant_access = _parse_tenant_access(groups)

    if user and user.enabled:
        role = user.role
    elif tenant_access:
        role = "tenant_user"
    else:
        role = "guest"

    department = ""
    location = ""
    avatar_icon = "user"

    # 1. Fallback/Initial read from Keycloak
    kc_user = await _get_keycloak_user(email)
    if kc_user:
        fn = kc_user.get("firstName") or ""
        ln = kc_user.get("lastName") or ""
        if fn or ln:
            name = f"{fn} {ln}".strip()
        attrs = kc_user.get("attributes") or {}
        department = attrs.get("department", [""])[0]
        location = attrs.get("location", [""])[0]
        avatar_icon = attrs.get("avatarIcon", ["user"])[0]

    # 2. Prefer/override with local database if fields are populated
    if user:
        if user.name:
            name = user.name
        if user.department:
            department = user.department
        if user.location:
            location = user.location
        if user.avatar_icon:
            avatar_icon = user.avatar_icon

    return {
        "email": email,
        "name": name,
        "role": role,
        "is_super_admin": is_super_admin,
        "tenant_access": tenant_access,
        "groups": groups,
        "can_manage_projects": (user.can_manage_projects if user else False) or is_super_admin,
        "auth_source": auth_source,
        "registered": user is not None,
        "department": department,
        "location": location,
        "avatar_icon": avatar_icon,
    }


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    avatar_icon: Optional[str] = None


@router.patch("/me")
async def update_profile(
    body: ProfileUpdate,
    authorization: Optional[str] = Header(None, alias="Authorization"),
    access_token: Optional[str] = Cookie(None, alias="access_token"),
    dev_auth: Optional[str] = Cookie(None, alias="dev_auth"),
    db: AsyncSession = Depends(get_db),
):
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
    if not email and dev_auth:
        email = dev_auth.strip()

    if not email:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # 1. Try updating Keycloak, log exceptions/errors gracefully
    try:
        from api.keycloak import _admin_token, BASE
        token = await _admin_token()
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            search_resp = await client.get(
                f"{BASE}/users",
                params={"email": email, "exact": "true"},
                headers={"Authorization": f"Bearer {token}"},
            )
            if search_resp.status_code == 200:
                users = search_resp.json()
                if not users:
                    search_resp = await client.get(
                        f"{BASE}/users",
                        params={"username": email, "exact": "true"},
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    users = search_resp.json() if search_resp.status_code == 200 else []
                
                if users:
                    uid = users[0]["id"]
                    detail_resp = await client.get(
                        f"{BASE}/users/{uid}",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if detail_resp.status_code == 200:
                        kc_user = detail_resp.json()
                        payload = {**kc_user}

                        if body.name is not None:
                            parts = body.name.strip().split(maxsplit=1)
                            payload["firstName"] = parts[0] if parts else ""
                            payload["lastName"] = parts[1] if len(parts) > 1 else ""

                        attributes = payload.get("attributes") or {}
                        if body.department is not None:
                            attributes["department"] = [body.department]
                        if body.location is not None:
                            attributes["location"] = [body.location]
                        if body.avatar_icon is not None:
                            attributes["avatarIcon"] = [body.avatar_icon]
                        payload["attributes"] = attributes

                        await client.put(
                            f"{BASE}/users/{uid}",
                            json=payload,
                            headers={"Authorization": f"Bearer {token}"},
                        )
    except Exception as e:
        print(f"Error syncing profile update to Keycloak: {e}")

    # 2. Update local database PlatformUser
    stmt = select(PlatformUser).where(PlatformUser.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = PlatformUser(
            email=email,
            role="guest",
            enabled=True,
            can_manage_projects=False,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    if body.name is not None:
        user.name = body.name
    if body.department is not None:
        user.department = body.department
    if body.location is not None:
        user.location = body.location
    if body.avatar_icon is not None:
        user.avatar_icon = body.avatar_icon

    await db.commit()
    return {"status": "success"}
