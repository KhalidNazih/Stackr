from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from db.session import get_db
from db.models import ProvisioningRequest, PlatformUser
from config import settings
from api.auth import get_current_user_email
from api.gitlab_api import commit_registry, RegistryCommitRequest
from api.keycloak import provision_tenant, TenantProvisionRequest

router = APIRouter(prefix="/api/provisioning-requests", tags=["provisioning"])


class ProvisionRequestPayload(BaseModel):
    tenant_id: str
    manifest: dict
    display_name: str


@router.post("")
@router.post("/")
async def create_provisioning_request(
    payload: ProvisionRequestPayload,
    db: AsyncSession = Depends(get_db),
    email: str = Depends(get_current_user_email)
):
    result = await db.execute(select(PlatformUser).where(PlatformUser.email == email))
    user = result.scalar_one_or_none()
    req = ProvisioningRequest(
        tenant_id=payload.tenant_id,
        requested_by=user.id if user else None,
        status="pending",
        payload={
            "manifest": payload.manifest,
            "display_name": payload.display_name
        }
    )
    db.add(req)
    await db.commit()
    await db.refresh(req)
    return {"id": str(req.id), "tenant_id": req.tenant_id, "status": req.status}


@router.get("")
@router.get("/")
async def get_provisioning_requests(db: AsyncSession = Depends(get_db)):
    # Include requester email for UI
    stmt = (
        select(ProvisioningRequest, PlatformUser.email)
        .outerjoin(PlatformUser, ProvisioningRequest.requested_by == PlatformUser.id)
        .where(ProvisioningRequest.status == "pending")
    )
    res = await db.execute(stmt)
    results = res.all()
    return [
        {
            "id": str(req.id),
            "tenant_id": req.tenant_id,
            "status": req.status,
            "payload": req.payload,
            "requested_by": user_email,
            "created_at": req.created_at.isoformat() if req.created_at else None
        }
        for req, user_email in results
    ]


@router.post("/{req_id}/approve")
async def approve_provisioning_request(req_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    req = await db.get(ProvisioningRequest, req_id)
    if not req or req.status != "pending":
        raise HTTPException(404, "Pending request not found")

    payload = req.payload or {}
    tenant_id = req.tenant_id
    manifest = payload.get("manifest", {})
    display_name = payload.get("display_name", tenant_id)

    # 1. Commit to GitLab via GitOps registry
    try:
        await commit_registry(RegistryCommitRequest(tenant_id=tenant_id, manifest=manifest))
    except Exception as e:
        raise HTTPException(502, f"GitLab registry commit failed: {e}")

    # 2. Provision tenant in Keycloak
    try:
        await provision_tenant(TenantProvisionRequest(tenant_id=tenant_id, display_name=display_name))
    except Exception as e:
        raise HTTPException(502, f"Keycloak provisioning failed: {e}")

    # Mark as approved
    req.status = "approved"
    await db.commit()
    return {"status": "approved", "tenant_id": tenant_id}


@router.post("/{req_id}/reject")
async def reject_provisioning_request(req_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    req = await db.get(ProvisioningRequest, req_id)
    if not req or req.status != "pending":
        raise HTTPException(404, "Pending request not found")

    req.status = "rejected"
    await db.commit()
    return {"status": "rejected", "tenant_id": req.tenant_id}
