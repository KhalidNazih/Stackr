import uuid
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from db.models import PlatformUser

router = APIRouter(prefix="/api/platform-users", tags=["platform-users"])


class UserCreate(BaseModel):
    email: str
    role: str = "user"
    can_manage_projects: bool = False
    enabled: bool = False


class UserUpdate(BaseModel):
    role: str | None = None
    can_manage_projects: bool | None = None
    enabled: bool | None = None


@router.get("")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlatformUser).order_by(PlatformUser.created_at.desc()))
    users = result.scalars().all()
    return [_serialize(u) for u in users]


@router.get("/{user_id}")
async def get_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(PlatformUser, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return _serialize(user)


async def _sync_keycloak_status(email: str, enabled: bool):
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
                    # Fallback to search without exact if no match
                    search_resp = await client.get(
                        f"{BASE}/users",
                        params={"search": email},
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    users = search_resp.json()
                matched = next((u for u in users if u.get("email") == email or u.get("username") == email), None)
                if matched:
                    uid = matched["id"]
                    detail_resp = await client.get(
                        f"{BASE}/users/{uid}",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if detail_resp.status_code == 200:
                        kc_user = detail_resp.json()
                        payload = {**kc_user, "enabled": enabled}
                        await client.put(
                            f"{BASE}/users/{uid}",
                            json=payload,
                            headers={"Authorization": f"Bearer {token}"},
                        )
                    if not enabled:
                        groups_resp = await client.get(
                            f"{BASE}/users/{uid}/groups",
                            headers={"Authorization": f"Bearer {token}"},
                        )
                        if groups_resp.status_code == 200:
                            for group in groups_resp.json():
                                await client.delete(
                                    f"{BASE}/users/{uid}/groups/{group['id']}",
                                    headers={"Authorization": f"Bearer {token}"},
                                )
    except Exception as e:
        print(f"Error syncing Keycloak status: {e}")


@router.post("", status_code=201)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(PlatformUser).where(PlatformUser.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"User already exists: {body.email}")
    user = PlatformUser(**body.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    await _sync_keycloak_status(user.email, user.enabled)
    
    return _serialize(user)


@router.patch("/{user_id}")
async def update_user(user_id: uuid.UUID, body: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(PlatformUser, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    
    if body.enabled is not None:
        await _sync_keycloak_status(user.email, user.enabled)
        
    return _serialize(user)


@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(PlatformUser, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    
    await _sync_keycloak_status(user.email, False)
    
    await db.delete(user)
    await db.commit()


@router.delete("/email/{email}", status_code=204)
async def delete_user_by_email(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PlatformUser).where(PlatformUser.email == email))
    user = result.scalar_one_or_none()
    if user:
        await db.delete(user)
        await db.commit()
    
    await _sync_keycloak_status(email, False)


def _serialize(u: PlatformUser) -> dict:
    return {
        "id": str(u.id),
        "email": u.email,
        "role": u.role,
        "can_manage_projects": u.can_manage_projects,
        "enabled": u.enabled,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "name": u.name,
        "department": u.department,
        "location": u.location,
        "avatar_icon": u.avatar_icon,
    }
