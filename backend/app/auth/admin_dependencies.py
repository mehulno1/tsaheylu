from fastapi import Depends, HTTPException
from app.core.auth import get_current_user_id
from app.db.session import engine
from sqlalchemy import text


def get_admin_user(
    user_id: int = Depends(get_current_user_id),
):
    """
    Verify user has admin or superadmin role in at least one club.
    """
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT 1
                FROM memberships
                WHERE user_id = :user_id
                  AND role IN ('admin', 'superadmin')
                LIMIT 1
                """
            ),
            {"user_id": user_id},
        ).fetchone()

        if not result:
            raise HTTPException(
                status_code=403,
                detail="Admin access required",
            )

    return user_id


def get_club_admin(
    club_id: int,
    user_id: int = Depends(get_current_user_id),
):
    """
    Verify user has admin or superadmin role for the specific club.
    Returns user_id if authorized, raises 403 if not.
    """
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT 1
                FROM memberships
                WHERE user_id = :user_id
                  AND club_id = :club_id
                  AND role IN ('admin', 'superadmin')
                LIMIT 1
                """
            ),
            {
                "user_id": user_id,
                "club_id": club_id,
            },
        ).fetchone()

        if not result:
            raise HTTPException(
                status_code=403,
                detail="Admin access required for this club",
            )

    return user_id
