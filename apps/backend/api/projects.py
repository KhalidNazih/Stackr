import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from db.models import Project, ProjectMember

router = APIRouter(prefix="/api/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    owner_id: uuid.UUID | None = None


class MemberAdd(BaseModel):
    user_id: uuid.UUID
    role: str = "developer"


@router.get("")
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    return [_serialize(p) for p in projects]


@router.get("/{project_id}")
async def get_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return _serialize(project)


@router.post("", status_code=201)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**body.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _serialize(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    await db.delete(project)
    await db.commit()


@router.get("/{project_id}/members")
async def list_members(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProjectMember).where(ProjectMember.project_id == project_id)
    )
    return [{"user_id": str(m.user_id), "role": m.role} for m in result.scalars().all()]


@router.post("/{project_id}/members", status_code=201)
async def add_member(project_id: uuid.UUID, body: MemberAdd, db: AsyncSession = Depends(get_db)):
    member = ProjectMember(project_id=project_id, user_id=body.user_id, role=body.role)
    db.add(member)
    await db.commit()
    return {"project_id": str(project_id), "user_id": str(body.user_id), "role": body.role}


@router.delete("/{project_id}/members/{user_id}", status_code=204)
async def remove_member(project_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    member = await db.get(ProjectMember, (project_id, user_id))
    if not member:
        raise HTTPException(404, "Member not found")
    await db.delete(member)
    await db.commit()


def _serialize(p: Project) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description,
        "owner_id": str(p.owner_id) if p.owner_id else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
