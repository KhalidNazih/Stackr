from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
from config import settings

router = APIRouter(prefix="/api/keycloak", tags=["keycloak"])

BASE = f"{settings.KEYCLOAK_INTERNAL_URL.rstrip('/')}/admin/realms/{settings.KEYCLOAK_REALM}"


async def _admin_token() -> str:
    """Obtain a short-lived admin token via client_credentials."""
    token_url = f"{settings.KEYCLOAK_INTERNAL_URL.rstrip('/')}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/token"
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(token_url, data={
            "grant_type": "client_credentials",
            "client_id": settings.KEYCLOAK_CLIENT_ID,
            "client_secret": settings.KEYCLOAK_CLIENT_SECRET,
        })
    if resp.status_code != 200:
        raise HTTPException(502, f"Keycloak admin token error: {resp.text}")
    return resp.json()["access_token"]


@router.get("/users")
async def search_users(search: str = Query(""), limit: int = 20):
    token = await _admin_token()
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{BASE}/users",
            params={"search": search, "max": limit},
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


@router.get("/users/{user_id}")
async def get_user(user_id: str):
    token = await _admin_token()
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{BASE}/users/{user_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code == 404:
        return None
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


class TenantProvisionRequest(BaseModel):
    tenant_id: str
    display_name: str


@router.post("/tenants")
async def provision_tenant(body: TenantProvisionRequest):
    """Create Keycloak groups for a new tenant: {tenant_id}-admins and {tenant_id}-users."""
    token = await _admin_token()
    created = []
    async with httpx.AsyncClient(verify=False) as client:
        for suffix in ["admins", "users"]:
            group_name = f"{body.tenant_id}-{suffix}"
            resp = await client.post(
                f"{BASE}/groups",
                json={"name": group_name},
                headers={"Authorization": f"Bearer {token}"},
            )
            if resp.status_code not in (201, 409):
                raise HTTPException(resp.status_code, f"Failed to create group {group_name}: {resp.text}")
            created.append(group_name)

    return {"created_groups": created, "tenant_id": body.tenant_id}


@router.delete("/tenants/{tenant_id}")
async def deprovision_tenant(tenant_id: str):
    """Delete Keycloak groups for a tenant."""
    token = await _admin_token()
    deleted = []
    async with httpx.AsyncClient(verify=False) as client:
        for suffix in ["admins", "users"]:
            group_name = f"{tenant_id}-{suffix}"
            search_resp = await client.get(
                f"{BASE}/groups",
                params={"search": group_name},
                headers={"Authorization": f"Bearer {token}"},
            )
            groups = search_resp.json()
            for group in groups:
                if group["name"] == group_name:
                    del_resp = await client.delete(
                        f"{BASE}/groups/{group['id']}",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if del_resp.status_code in (204, 404):
                        deleted.append(group_name)
    return {"deleted_groups": deleted, "tenant_id": tenant_id}


def _find_group_recursively(groups: list, target_name: str) -> dict | None:
    for g in groups:
        name = g.get("name", "")
        path = g.get("path", "")
        if name.lower() == target_name.lower() or path.lower().endswith(f"/{target_name.lower()}"):
            return g
        found = _find_group_recursively(g.get("subGroups", []), target_name)
        if found:
            return found
    return None


async def _find_group_by_name(client: httpx.AsyncClient, token: str, group_name: str) -> dict | None:
    # 1. Try fuzzy search first
    search_resp = await client.get(
        f"{BASE}/groups",
        params={"search": group_name, "briefRepresentation": "false"},
        headers={"Authorization": f"Bearer {token}"},
    )
    if search_resp.status_code == 200:
        groups = search_resp.json()
        target_group = _find_group_recursively(groups, group_name)
        if target_group:
            return target_group

    # 2. Fallback: retrieve all groups and perform recursive search
    all_resp = await client.get(
        f"{BASE}/groups",
        headers={"Authorization": f"Bearer {token}"},
    )
    if all_resp.status_code == 200:
        groups = all_resp.json()
        target_group = _find_group_recursively(groups, group_name)
        if target_group:
            return target_group

    return None


@router.get("/groups/{group_name}/members")
async def get_group_members(group_name: str):
    """Get members of a specific Keycloak group."""
    token = await _admin_token()
    async with httpx.AsyncClient(verify=False) as client:
        target_group = await _find_group_by_name(client, token, group_name)
        if not target_group:
            return []
            
        # Then get its members
        members_resp = await client.get(
            f"{BASE}/groups/{target_group['id']}/members",
            headers={"Authorization": f"Bearer {token}"},
        )
        if members_resp.status_code != 200:
            raise HTTPException(members_resp.status_code, members_resp.text)
            
        return members_resp.json()


@router.post("/groups/{group_name}/members/{email}")
async def add_group_member(group_name: str, email: str):
    """Add a user to a Keycloak group by email."""
    token = await _admin_token()
    async with httpx.AsyncClient(verify=False) as client:
        target_group = await _find_group_by_name(client, token, group_name)
        if not target_group:
            raise HTTPException(404, f"Group {group_name} not found")
            
        # Find user ID by email
        user_search_resp = await client.get(
            f"{BASE}/users",
            params={"email": email, "exact": "true"},
            headers={"Authorization": f"Bearer {token}"},
        )
        users = user_search_resp.json()
        if not users:
            # Try searching by username if email fails
            user_search_resp = await client.get(
                f"{BASE}/users",
                params={"username": email, "exact": "true"},
                headers={"Authorization": f"Bearer {token}"},
            )
            users = user_search_resp.json()
            if not users:
                raise HTTPException(404, f"User {email} not found in Keycloak")
                
        user_id = users[0]["id"]
        
        # Add user to group
        put_resp = await client.put(
            f"{BASE}/users/{user_id}/groups/{target_group['id']}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if put_resp.status_code not in (204, 200, 201):
            raise HTTPException(put_resp.status_code, put_resp.text)
            
        return {"added": email, "group": group_name}


@router.delete("/groups/{group_name}/members/{email}")
async def remove_group_member(group_name: str, email: str):
    """Remove a user from a Keycloak group by email."""
    token = await _admin_token()
    async with httpx.AsyncClient(verify=False) as client:
        target_group = await _find_group_by_name(client, token, group_name)
        if not target_group:
            raise HTTPException(404, f"Group {group_name} not found")
            
        # Find user ID by email
        user_search_resp = await client.get(
            f"{BASE}/users",
            params={"email": email, "exact": "true"},
            headers={"Authorization": f"Bearer {token}"},
        )
        users = user_search_resp.json()
        if not users:
            user_search_resp = await client.get(
                f"{BASE}/users",
                params={"username": email, "exact": "true"},
                headers={"Authorization": f"Bearer {token}"},
            )
            users = user_search_resp.json()
            if not users:
                raise HTTPException(404, f"User {email} not found in Keycloak")
                
        user_id = users[0]["id"]
        
        # Remove user from group
        del_resp = await client.delete(
            f"{BASE}/users/{user_id}/groups/{target_group['id']}",
            headers={"Authorization": f"Bearer {token}"},
        )
        if del_resp.status_code not in (204, 200):
            raise HTTPException(del_resp.status_code, del_resp.text)
            
        return {"removed": email, "group": group_name}


@router.put("/users/{user_id}")
async def update_keycloak_user(user_id: str, body: dict):
    token = await _admin_token()
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        resp = await client.put(
            f"{BASE}/users/{user_id}",
            json=body,
            headers={"Authorization": f"Bearer {token}"},
        )
    if resp.status_code not in (200, 204):
        raise HTTPException(resp.status_code, resp.text)
    return {"status": "success"}
