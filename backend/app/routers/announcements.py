from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.core.auth import get_current_user_id
from app.auth.admin_dependencies import get_admin_user, get_club_admin
from app.db.session import engine
from app.db.announcement_repo import get_announcements_for_club

router = APIRouter()


# ------------------------
# MEMBER: Read announcements
# ------------------------
@router.get("/clubs/{club_id}/announcements")
def club_announcements(
    club_id: int,
    user_id: int = Depends(get_current_user_id),
):
    return get_announcements_for_club(club_id)


# ------------------------
# ADMIN: Create announcement
# ------------------------
@router.post("/clubs/{club_id}/announcements")
def create_announcement(
    club_id: int,
    payload: dict,
    admin_user_id: int = Depends(get_club_admin),
):
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                INSERT INTO announcements (club_id, title, message)
                VALUES (:club_id, :title, :message)
                """
            ),
            {
                "club_id": club_id,
                "title": payload.get("title"),
                "message": payload.get("message"),
            },
        )

    return {"success": True}

