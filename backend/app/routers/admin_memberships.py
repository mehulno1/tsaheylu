from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.auth.admin_dependencies import get_admin_user, get_club_admin
from app.db.session import engine

router = APIRouter(prefix="/admin")


@router.get("/clubs/{club_id}/pending-members")
def get_pending_members(
    club_id: int,
    admin_user_id: int = Depends(get_club_admin),
):
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT
                    m.id AS membership_id,
                    u.phone_number AS phone,
                    d.name AS dependent_name,
                    d.relation AS relation
                FROM memberships m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN dependents d ON d.id = m.dependent_id
                WHERE m.club_id = :club_id
                  AND m.status = 'pending'
                """
            ),
            {"club_id": club_id},
        )

        return [dict(row._mapping) for row in result]


@router.post("/memberships/{membership_id}/approve")
def approve_member(
    membership_id: int,
    admin_user_id: int = Depends(get_admin_user),
):
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE memberships
                SET status = 'active'
                WHERE id = :id
                """
            ),
            {"id": membership_id},
        )

    return {"success": True}

@router.post("/memberships/{membership_id}/reject")
def reject_member(
    membership_id: int,
    payload: dict,
    admin_user_id: int = Depends(get_admin_user),
):
    reason = payload.get("reason")

    if not reason:
        return {"error": "Rejection reason is required"}

    with engine.begin() as conn:
        conn.execute(
            text(
                """
                UPDATE memberships
                SET status = 'rejected',
                    rejection_reason = :reason
                WHERE id = :id
                """
            ),
            {
                "id": membership_id,
                "reason": reason,
            },
        )

    return {"success": True}

