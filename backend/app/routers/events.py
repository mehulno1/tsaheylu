from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.db.event_repo import get_events_for_club
from app.db.event_pass_repo import create_event_pass
from app.db.membership_repo import is_user_member_of_event_club

router = APIRouter()


# ✅ EXISTING — List events for a club
@router.get("/clubs/{club_id}/events")
def list_club_events(
    club_id: int,
    user_id: int = Depends(get_current_user_id),
):
    return get_events_for_club(club_id)


# ✅ NEW — Attend event (auto-generate pass)
@router.post("/events/{event_id}/attend")
def attend_event(
    event_id: int,
    payload: dict,
    user_id: int = Depends(get_current_user_id),
):
    dependent_id = payload.get("dependent_id")

    # 1️⃣ Validate membership (self or dependent)
    if not is_user_member_of_event_club(
        user_id=user_id,
        event_id=event_id,
        dependent_id=dependent_id,
    ):
        raise HTTPException(
            status_code=403,
            detail="Not a member of this club",
        )

    # 2️⃣ Create pass
    try:
        return create_event_pass(
            event_id=event_id,
            user_id=user_id,
            dependent_id=dependent_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
