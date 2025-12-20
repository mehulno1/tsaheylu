from app.db.session import SessionLocal
from sqlalchemy import text

def get_announcements_for_club(club_id: int):
    db = SessionLocal()
    try:
        result = db.execute(
            text(
                """
                SELECT
                    id,
                    title,
                    message,
                    created_at
                FROM announcements
                WHERE club_id = :club_id
                ORDER BY created_at DESC
                """
            ),
            {"club_id": club_id},
        )
        return [dict(row._mapping) for row in result]
    finally:
        db.close()
