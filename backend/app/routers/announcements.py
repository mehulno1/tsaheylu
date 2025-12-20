from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.db.announcement_repo import get_announcements_for_club

router = APIRouter()

@router.get("/clubs/{club_id}/announcements")
def club_announcements(
    club_id: int,
    user_id: int = Depends(get_current_user_id),
):
    return get_announcements_for_club(club_id)
