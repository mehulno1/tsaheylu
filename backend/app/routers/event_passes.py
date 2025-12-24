from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user_id
from app.db.event_pass_repo import get_passes_for_user
from app.db.event_pass_repo import create_event_pass
router = APIRouter()

@router.get("/me/passes")
def my_event_passes(
    user_id: int = Depends(get_current_user_id),
):
    return get_passes_for_user(user_id)

@router.post("/events/{event_id}/passes")
def generate_event_pass(
    event_id: int,
    payload: dict,
    user_id: int = Depends(get_current_user_id),
):
    dependent_id = payload.get("dependent_id")
    try:
        return create_event_pass(event_id, user_id, dependent_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))