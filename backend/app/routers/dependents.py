from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.auth import get_current_user_id
from app.db.dependents_repo import create_dependent, get_dependents_for_user

router = APIRouter()


class DependentCreateRequest(BaseModel):
    name: str
    relation: str
    date_of_birth: Optional[str] = None


@router.get("/me/dependents")
def list_dependents(
    user_id: int = Depends(get_current_user_id),
):
    return get_dependents_for_user(user_id)


@router.post("/me/dependents")
def add_dependent(
    payload: DependentCreateRequest,
    user_id: int = Depends(get_current_user_id),
):
    create_dependent(
        user_id=user_id,
        name=payload.name,
        relation=payload.relation,
        date_of_birth=payload.date_of_birth,
    )
    return {"status": "ok"}
