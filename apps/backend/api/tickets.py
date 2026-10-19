import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.session import get_db
from db.models import Ticket, PlatformUser
from api.auth import get_current_user_email

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


class TicketCreate(BaseModel):
    title: str
    description: str
    reported_by: Optional[str] = None


class TicketUpdate(BaseModel):
    status: str
    resolution_message: Optional[str] = None


@router.get("")
async def list_tickets(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ticket).order_by(Ticket.created_at.desc()))
    tickets = result.scalars().all()
    return [_serialize(t) for t in tickets]


@router.post("", status_code=201)
async def create_ticket(
    body: TicketCreate,
    db: AsyncSession = Depends(get_db),
):
    ticket = Ticket(
        title=body.title,
        description=body.description,
        reported_by=body.reported_by or "dev@example.com",
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return _serialize(ticket)


@router.patch("/{ticket_id}")
async def update_ticket(
    ticket_id: uuid.UUID,
    body: TicketUpdate,
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    ticket.status = body.status
    if body.resolution_message is not None:
        ticket.resolution_message = body.resolution_message
        
    await db.commit()
    await db.refresh(ticket)
    return _serialize(ticket)


def _serialize(t: Ticket) -> dict:
    return {
        "id": str(t.id),
        "title": t.title,
        "description": t.description,
        "status": t.status,
        "reported_by": t.reported_by,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "resolution_message": t.resolution_message,
    }
