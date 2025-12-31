from fastapi import APIRouter, Depends
from app.auth.admin_dependencies import get_admin_user
from app.db.membership_repo import get_admin_clubs

router = APIRouter(prefix="/admin", tags=["Admin Clubs"])


@router.get("/my-clubs")
def get_my_clubs(
    admin_user_id: int = Depends(get_admin_user),
):
    """
    Get clubs where the authenticated admin user has admin or superadmin role.
    """
    return get_admin_clubs(admin_user_id)

