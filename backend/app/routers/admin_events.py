from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from app.auth.admin_dependencies import get_club_admin
from app.db.event_repo import create_event

router = APIRouter(prefix="/admin")


class CreateEventRequest(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: str  # ISO string
    location: Optional[str] = None
    requires_pass: bool = True


@router.post("/clubs/{club_id}/events")
def create_club_event(
    club_id: int,
    payload: CreateEventRequest,
    admin_user_id: int = Depends(get_club_admin),
):
    create_event(
        club_id=club_id,
        title=payload.title,
        description=payload.description,
        event_date=payload.event_date,
        location=payload.location,
        requires_pass=payload.requires_pass,
    )

    return {"status": "ok"}
