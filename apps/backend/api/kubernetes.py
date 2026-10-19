from fastapi import APIRouter, HTTPException, Query
import httpx
from config import settings

router = APIRouter(prefix="/api/kubernetes", tags=["kubernetes"])

KUBE_HEADERS = {"Authorization": f"Bearer {settings.KUBE_TOKEN}"}


@router.get("/namespaces")
async def list_namespaces():
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{settings.KUBE_API_URL}/api/v1/namespaces",
            headers=KUBE_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    items = resp.json().get("items", [])
    return [
        {
            "name": ns["metadata"]["name"],
            "status": ns["status"]["phase"],
            "created_at": ns["metadata"]["creationTimestamp"],
            "labels": ns["metadata"].get("labels", {}),
        }
        for ns in items
    ]


@router.get("/pods")
async def list_all_pods():
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{settings.KUBE_API_URL}/api/v1/pods",
            headers=KUBE_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    items = resp.json().get("items", [])
    return [
        {
            "name": pod["metadata"]["name"],
            "namespace": pod["metadata"]["namespace"],
            "phase": pod["status"].get("phase"),
            "ready": _pod_ready(pod),
            "restarts": _pod_restarts(pod),
            "node": pod["spec"].get("nodeName"),
            "created_at": pod["metadata"]["creationTimestamp"],
        }
        for pod in items
    ]


@router.get("/namespaces/{namespace}/pods")
async def list_pods(namespace: str):
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{settings.KUBE_API_URL}/api/v1/namespaces/{namespace}/pods",
            headers=KUBE_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    items = resp.json().get("items", [])
    return [
        {
            "name": pod["metadata"]["name"],
            "namespace": pod["metadata"]["namespace"],
            "phase": pod["status"].get("phase"),
            "ready": _pod_ready(pod),
            "restarts": _pod_restarts(pod),
            "node": pod["spec"].get("nodeName"),
            "created_at": pod["metadata"]["creationTimestamp"],
        }
        for pod in items
    ]


@router.get("/namespaces/{namespace}/deployments")
async def list_deployments(namespace: str):
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{settings.KUBE_API_URL}/apis/apps/v1/namespaces/{namespace}/deployments",
            headers=KUBE_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    items = resp.json().get("items", [])
    return [
        {
            "name": d["metadata"]["name"],
            "namespace": d["metadata"]["namespace"],
            "replicas": d["spec"].get("replicas", 0),
            "ready_replicas": d["status"].get("readyReplicas", 0),
            "available_replicas": d["status"].get("availableReplicas", 0),
            "created_at": d["metadata"]["creationTimestamp"],
        }
        for d in items
    ]


@router.get("/deployments")
async def list_all_deployments():
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{settings.KUBE_API_URL}/apis/apps/v1/deployments",
            headers=KUBE_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    items = resp.json().get("items", [])
    return [
        {
            "name": d["metadata"]["name"],
            "namespace": d["metadata"]["namespace"],
            "replicas": d["spec"].get("replicas", 0),
            "ready_replicas": d["status"].get("readyReplicas", 0),
            "available_replicas": d["status"].get("availableReplicas", 0),
            "created_at": d["metadata"]["creationTimestamp"],
        }
        for d in items
    ]


@router.get("/nodes")
async def list_nodes():
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(
            f"{settings.KUBE_API_URL}/api/v1/nodes",
            headers=KUBE_HEADERS,
        )
    if resp.status_code != 200:
        raise HTTPException(resp.status_code, resp.text)
    items = resp.json().get("items", [])
    return [
        {
            "name": node["metadata"]["name"],
            "status": _node_ready(node),
            "roles": _node_roles(node),
            "capacity": node["status"].get("capacity", {}),
            "allocatable": node["status"].get("allocatable", {}),
        }
        for node in items
    ]


def _pod_ready(pod: dict) -> bool:
    conditions = pod["status"].get("conditions", [])
    for c in conditions:
        if c["type"] == "Ready":
            return c["status"] == "True"
    return False


def _pod_restarts(pod: dict) -> int:
    containers = pod["status"].get("containerStatuses", [])
    return sum(c.get("restartCount", 0) for c in containers)


def _node_ready(node: dict) -> str:
    conditions = node["status"].get("conditions", [])
    for c in conditions:
        if c["type"] == "Ready":
            return "Ready" if c["status"] == "True" else "NotReady"
    return "Unknown"


def _node_roles(node: dict) -> list[str]:
    labels = node["metadata"].get("labels", {})
    return [k.split("/")[1] for k in labels if k.startswith("node-role.kubernetes.io/")]
