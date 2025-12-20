from sqlalchemy import text
from app.db.session import engine


def get_clubs_for_user(user_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    c.id AS club_id,
                    c.name AS club_name,
                    m.role,
                    m.status,
                    m.expiry_date
                FROM memberships m
                JOIN clubs c ON c.id = m.club_id
                WHERE m.user_id = :user_id
            """),
            {"user_id": user_id},
        )
        return [dict(row._mapping) for row in result]
