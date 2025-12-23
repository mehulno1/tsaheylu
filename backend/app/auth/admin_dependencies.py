from fastapi import Depends, HTTPException
from app.core.auth import get_current_user_id
from app.db.session import engine
from sqlalchemy import text


def get_admin_user(
    user_id: int = Depends(get_current_user_id),
):
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
