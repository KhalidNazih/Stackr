from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
from config import settings

router = APIRouter(prefix="/api/argocd", tags=["argocd"])

BASE = f"{settings.ARGOCD_URL.rstrip('/')}/api/v1"
HEADERS = {"Authorization": f"Bearer {settings.ARGOCD_TOKEN}"}


@router.get("/applications")
async def list_applications(project: str = Query(None)):
    params = {}
    if project:
        params["project"] = project
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(f"{BASE}/applications", params=params, headers=HEADERS)
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    data = resp.json()
    items = data.get("items") or []
    return [_map_app(app) for app in items]


@router.get("/applications/{name}")
async def get_application(name: str):
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(f"{BASE}/applications/{name}", headers=HEADERS)
    if resp.status_code == 404:
        raise HTTPException(404, f"Application not found: {name}")
    resp.raise_for_status()
    return _map_app(resp.json())


@router.post("/applications/{name}/sync")
async def sync_application(name: str):
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(f"{BASE}/applications/{name}/sync", headers=HEADERS, json={})
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    return {"synced": name}


class CreateApplicationRequest(BaseModel):
    name: str
    project: str = "default"
    repo_url: str
    path: str
    target_revision: str = "HEAD"
    destination_server: str = "https://kubernetes.default.svc"
    destination_namespace: str


@router.post("/applications")
async def create_application(body: CreateApplicationRequest):
    manifest = {
        "apiVersion": "argoproj.io/v1alpha1",
        "kind": "Application",
        "metadata": {"name": body.name, "namespace": "argocd"},
        "spec": {
            "project": body.project,
            "source": {
                "repoURL": body.repo_url,
                "path": body.path,
                "targetRevision": body.target_revision,
            },
            "destination": {
                "server": body.destination_server,
                "namespace": body.destination_namespace,
            },
            "syncPolicy": {"automated": {"prune": True, "selfHeal": True}},
        },
    }
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.post(f"{BASE}/applications", json=manifest, headers=HEADERS)
    if resp.status_code not in (200, 201):
        raise HTTPException(resp.status_code, resp.text)
    return _map_app(resp.json())


@router.delete("/applications/{name}")
async def delete_application(name: str):
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.delete(f"{BASE}/applications/{name}", headers=HEADERS)
    if resp.status_code not in (200, 204, 404):
        raise HTTPException(resp.status_code, resp.text)
    return {"deleted": name}


def _map_app(app: dict) -> dict:
    meta = app.get("metadata", {})
    spec = app.get("spec", {})
    status = app.get("status", {})
    source = spec.get("source", {})
    dest = spec.get("destination", {})
    sync = status.get("sync", {})
    health = status.get("health", {})
    op_state = status.get("operationState", {})
    return {
        "name": meta.get("name"),
        "namespace": meta.get("namespace"),
        "project": spec.get("project"),
        "syncStatus": sync.get("status", "Unknown"),
        "health": health.get("status", "Unknown"),
        "repoURL": source.get("repoURL"),
        "path": source.get("path"),
        "targetRevision": source.get("targetRevision"),
        "destinationServer": dest.get("server"),
        "destinationNamespace": dest.get("namespace"),
        "lastSyncAt": op_state.get("finishedAt"),
    }
