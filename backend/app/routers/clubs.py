from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.core.auth import get_current_user_id
from app.db.membership_repo import get_clubs_for_user, request_membership, request_memberships_batch, get_all_clubs

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/clubs")
def my_clubs(user_id: int = Depends(get_current_user_id)):
    clubs = get_clubs_for_user(user_id)
    return clubs


@router.get("/clubs/all")
def all_clubs(user_id: int = Depends(get_current_user_id)):
    """
    Get all clubs in the system.
    Returns clubs the user can browse and request membership for.
    """
    return get_all_clubs()


@router.post("/clubs/{club_id}/request-membership")
def request_club_membership(
    club_id: int,
    payload: dict,
    user_id: int = Depends(get_current_user_id),
):
    """
    Request membership for a club.
    Accepts either:
    - dependent_id (single member, legacy format)
    - dependent_ids (array of dependent_id values, null for self)
    
    Example: {"dependent_ids": [null, 2, 5]} requests for self + dependents 2 and 5
    """
    # Check for new batch format first
    if "dependent_ids" in payload:
        dependent_ids_raw = payload.get("dependent_ids", [])
        
        if not isinstance(dependent_ids_raw, list):
            raise HTTPException(
                status_code=400,
                detail="dependent_ids must be an array"
            )
        
        # Validate and convert dependent_ids
        dependent_ids: list[Optional[int]] = []
        for dep_id in dependent_ids_raw:
            if dep_id is None:
                dependent_ids.append(None)
            else:
                try:
                    dependent_ids.append(int(dep_id))
                except (ValueError, TypeError):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid dependent_id: {dep_id}"
                    )
        
        if not dependent_ids:
            raise HTTPException(
                status_code=400,
                detail="At least one member must be selected"
            )
        
        return request_memberships_batch(
            user_id=user_id,
            club_id=club_id,
            dependent_ids=dependent_ids,
        )
    
    # Legacy single-member format (backward compatibility)
    dependent_id = payload.get("dependent_id")
    
    if dependent_id is not None:
        try:
            dependent_id = int(dependent_id)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid dependent_id"
            )
    
    try:
        return request_membership(
            user_id=user_id,
            club_id=club_id,
            dependent_id=dependent_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
