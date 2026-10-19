import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import httpx
import yaml
from typing import Optional
from config import settings

router = APIRouter(prefix="/api/gitlab", tags=["gitlab"])

GITLAB_API = f"{settings.GITLAB_URL.rstrip('/')}/api/v4"
HEADERS = {"PRIVATE-TOKEN": settings.GITLAB_TOKEN}
PROJECT_ID = settings.GITLAB_PROJECT_ID
REGISTRY_PATH = settings.GITLAB_REGISTRY_PATH
DEFAULT_BRANCH = settings.GITLAB_DEFAULT_BRANCH


async def _get_file(path: str) -> dict | None:
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        resp = await client.get(
            f"{GITLAB_API}/projects/{PROJECT_ID}/repository/files/{path}",
            params={"ref": DEFAULT_BRANCH},
            headers=HEADERS,
        )
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()
    content = base64.b64decode(data["content"]).decode()
    return {"path": path, "content": content, "commit_id": data["last_commit_id"]}


async def _upsert_file(path: str, content: str, message: str):
    encoded = base64.b64encode(content.encode()).decode()
    # check if file exists
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        check = await client.get(
            f"{GITLAB_API}/projects/{PROJECT_ID}/repository/files/{path}",
            params={"ref": DEFAULT_BRANCH},
            headers=HEADERS,
        )
        if check.status_code == 404:
            method = client.post
        else:
            method = client.put

        resp = await method(
            f"{GITLAB_API}/projects/{PROJECT_ID}/repository/files/{path}",
            json={
                "branch": DEFAULT_BRANCH,
                "commit_message": message,
                "encoding": "base64",
                "content": encoded,
            },
            headers=HEADERS,
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


# ── Registry (tenant manifests) ───────────────────────────────────────────────

@router.get("/registry")
async def list_registry():
    async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
        resp = await client.get(
            f"{GITLAB_API}/projects/{PROJECT_ID}/repository/tree",
            params={"path": REGISTRY_PATH, "ref": DEFAULT_BRANCH, "per_page": 100},
            headers=HEADERS,
        )
    if resp.status_code == 404:
        return []
    resp.raise_for_status()
    files = [f for f in resp.json() if f["type"] == "blob" and f["name"].endswith(".yaml")]
    results = []
    for f in files:
        tenant_id = f["name"].replace(".yaml", "")
        file_path = f"{REGISTRY_PATH}/{f['name']}".replace("/", "%2F")
        file_data = await _get_file(file_path)
        if file_data:
            parsed = yaml.safe_load(file_data["content"])
            results.append({"tenant_id": tenant_id, "manifest": parsed})
    return results


@router.get("/registry/{tenant_id}")
async def get_registry(tenant_id: str):
    file_path = f"{REGISTRY_PATH}/{tenant_id}.yaml".replace("/", "%2F")
    file_data = await _get_file(file_path)
    if not file_data:
        raise HTTPException(404, f"Tenant manifest not found: {tenant_id}")
    parsed = yaml.safe_load(file_data["content"])
    return {"tenant_id": tenant_id, "manifest": parsed}


class RegistryCommitRequest(BaseModel):
    tenant_id: str
    manifest: Optional[dict] = None
    raw_yaml: Optional[str] = None


@router.post("/registry")
async def commit_registry(body: RegistryCommitRequest):
    if body.raw_yaml:
        content = body.raw_yaml
    elif body.manifest:
        content = yaml.dump(body.manifest, default_flow_style=False, allow_unicode=True)
    else:
        raise HTTPException(400, "Either manifest or raw_yaml must be provided")
        
    file_path = f"{REGISTRY_PATH}/{body.tenant_id}.yaml".replace("/", "%2F")
    result = await _upsert_file(file_path, content, f"feat: provision tenant {body.tenant_id}")
    return {"tenant_id": body.tenant_id, "commit": result}


@router.delete("/registry/{tenant_id}")
async def delete_registry(tenant_id: str):
    file_path = f"{REGISTRY_PATH}/{tenant_id}.yaml".replace("/", "%2F")
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{GITLAB_API}/projects/{PROJECT_ID}/repository/files/{file_path}",
            json={"branch": DEFAULT_BRANCH, "commit_message": f"feat: remove tenant {tenant_id}"},
            headers=HEADERS,
        )
    if resp.status_code not in (204, 404):
        raise HTTPException(resp.status_code, resp.text)
    return {"deleted": tenant_id}


# ── Pipelines ─────────────────────────────────────────────────────────────────

@router.get("/pipelines")
async def list_pipelines():
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITLAB_API}/projects/{PROJECT_ID}/pipelines",
            params={"per_page": 20},
            headers=HEADERS,
        )
    if resp.status_code == 404:
        return []
    resp.raise_for_status()
    pipelines = resp.json()
    results = []
    for p in pipelines:
        results.append({
            "id": str(p["id"]),
            "project": settings.GITLAB_TENANT_REPO,
            "commit": p.get("sha", "")[:7],
            "status": p.get("status", "unknown"),
            "duration": "N/A", # We would need to fetch each pipeline individually to get duration
            "startedAt": p.get("created_at")
        })
    return results

@router.post("/pipelines")
async def trigger_pipeline():
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GITLAB_API}/projects/{PROJECT_ID}/pipeline",
            params={"ref": DEFAULT_BRANCH},
            headers=HEADERS,
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(resp.status_code, resp.text)
    return {"triggered": True}


@router.get("/commits")
async def list_commits():
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{GITLAB_API}/projects/{PROJECT_ID}/repository/commits",
            params={"ref_name": DEFAULT_BRANCH, "per_page": 20},
            headers=HEADERS,
        )
    if resp.status_code == 404:
        return []
    resp.raise_for_status()
    commits = resp.json()
    results = []
    for c in commits:
        results.append({
            "id": c.get("short_id", c.get("id", "")[:7]),
            "msg": c.get("title", ""),
            "author": c.get("author_name", ""),
            "ago": c.get("created_at", "")
        })
    return results


# ── Generic commits ───────────────────────────────────────────────────────────

class CommitRequest(BaseModel):
    branch: str
    file_path: str
    content: str
    commit_message: str


@router.post("/commits")
async def commit_file(body: CommitRequest):
    encoded_path = body.file_path.replace("/", "%2F")
    result = await _upsert_file(encoded_path, body.content, body.commit_message)
    return {"commit": result}


# ── Projects ──────────────────────────────────────────────────────────────────

class CreateProjectRequest(BaseModel):
    name: str
    slug: str
    description: str = ""
    visibility: str = "private"
    namespace_id: int | None = None


@router.post("/projects")
async def create_project(body: CreateProjectRequest):
    payload = {
        "name": body.name,
        "path": body.slug,
        "description": body.description,
        "visibility": body.visibility,
        "initialize_with_readme": True,
    }
    if body.namespace_id:
        payload["namespace_id"] = body.namespace_id
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{GITLAB_API}/projects", json=payload, headers=HEADERS)
    if resp.status_code not in (200, 201):
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


class AddMemberRequest(BaseModel):
    username: str
    access_level: int = 30


@router.post("/projects/{project_id}/members")
async def add_member(project_id: int, body: AddMemberRequest):
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            f"{GITLAB_API}/users", params={"username": body.username}, headers=HEADERS
        )
        users = user_resp.json()
        if not users:
            raise HTTPException(404, f"GitLab user not found: {body.username}")
        user_id = users[0]["id"]
        resp = await client.post(
            f"{GITLAB_API}/projects/{project_id}/members",
            json={"user_id": user_id, "access_level": body.access_level},
            headers=HEADERS,
        )
    if resp.status_code not in (200, 201, 409):
        raise HTTPException(resp.status_code, resp.text)
    return resp.json()


@router.delete("/projects/{project_id}/members/{username}")
async def remove_member(project_id: int, username: str):
    async with httpx.AsyncClient() as client:
        user_resp = await client.get(
            f"{GITLAB_API}/users", params={"username": username}, headers=HEADERS
        )
        users = user_resp.json()
        if not users:
            raise HTTPException(404, f"GitLab user not found: {username}")
        user_id = users[0]["id"]
        resp = await client.delete(
            f"{GITLAB_API}/projects/{project_id}/members/{user_id}", headers=HEADERS
        )
    if resp.status_code not in (204, 404):
        raise HTTPException(resp.status_code, resp.text)
    return {"removed": username}


@router.get("/projects/{project_id}/members")
async def list_members(project_id: int):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{GITLAB_API}/projects/{project_id}/members", headers=HEADERS
        )
    resp.raise_for_status()
    return resp.json()
