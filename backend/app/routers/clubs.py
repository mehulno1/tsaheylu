from fastapi import APIRouter, Depends
from app.core.auth import get_current_user_id
from app.db.membership_repo import get_clubs_for_user

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/clubs")
def my_clubs(user_id: int = Depends(get_current_user_id)):
    clubs = get_clubs_for_user(user_id)
    return clubs
