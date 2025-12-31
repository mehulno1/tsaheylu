from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.auth.admin_dependencies import get_club_admin
from app.db.admin_members_repo import get_all_members_for_club

router = APIRouter(prefix="/admin", tags=["Admin Members"])


@router.get("/clubs/{club_id}/members")
def list_club_members(
    club_id: int,
    admin_id: int = Depends(get_club_admin),
):
    return get_all_members_for_club(club_id)
