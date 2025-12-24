from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.db.event_repo import get_events_for_club

router = APIRouter()


@router.get("/clubs/{club_id}/events")
def list_club_events(
    club_id: int,
    user_id: int = Depends(get_current_user_id),
):
    return get_events_for_club(club_id)
