from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.auth.admin_dependencies import get_admin_user
from app.db.event_pass_repo import get_passes_for_user
from app.db.event_pass_repo import create_event_pass
from app.db.event_pass_repo import get_passes_for_user_event
from app.db.event_pass_repo import get_passes_for_club
from app.db.membership_repo import is_user_member_of_event_club
router = APIRouter()

@router.get("/me/passes")
def my_event_passes(
    user_id: int = Depends(get_current_user_id),
):
    return get_passes_for_user(user_id)

@router.get("/events/{event_id}/passes/me")
def my_passes_for_event(
    event_id: int,
    user_id: int = Depends(get_current_user_id),
):
    return get_passes_for_user_event(
        event_id=event_id,
        user_id=user_id,
    )

@router.post("/events/{event_id}/passes")
def generate_event_pass(
    event_id: int,
    payload: dict,
    user_id: int = Depends(get_current_user_id),
):
    dependent_id = payload.get("dependent_id")
    
    # Validate active membership before creating pass
    if not is_user_member_of_event_club(
        user_id=user_id,
        event_id=event_id,
        dependent_id=dependent_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="Membership not approved. Only active members can generate event passes.",
        )
    
    try:
        return create_event_pass(event_id, user_id, dependent_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/admin/clubs/{club_id}/passes")
def get_club_passes(
    club_id: int,
    admin_user_id: int = Depends(get_admin_user),
):
    """
    Admin endpoint to get all event passes for a club.
    """
    return get_passes_for_club(club_id)