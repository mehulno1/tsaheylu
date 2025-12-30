from typing import Optional
from sqlalchemy import text
from app.db.session import engine


def get_clubs_for_user(user_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT
                    c.id AS club_id,
                    c.name AS club_name,
                    m.status,
                    m.rejection_reason,
                    m.expiry_date,

                    m.dependent_id,
                    d.name AS dependent_name,
                    d.relation AS dependent_relation

                FROM memberships m
                JOIN clubs c ON c.id = m.club_id
                LEFT JOIN dependents d ON d.id = m.dependent_id
                WHERE m.user_id = :user_id
                ORDER BY c.name
                """
            ),
            {"user_id": user_id},
        )

        clubs = {}

        for row in result:
            r = row._mapping
            club_id = r["club_id"]

            if club_id not in clubs:
                clubs[club_id] = {
                    "club_id": club_id,
                    "club_name": r["club_name"],
                    "status": r["status"],
                    "rejection_reason": r["rejection_reason"],
                    "expiry_date": r["expiry_date"],
                    "members": [],
                }

            if r["dependent_id"] is None:
                clubs[club_id]["members"].append(
                    {"type": "self"}
                )
            else:
                clubs[club_id]["members"].append(
                    {
                        "type": "dependent",
                        "name": r["dependent_name"],
                        "relation": r["dependent_relation"],
                    }
                )

        return list(clubs.values())


# Membership validation for events - requires active status
def is_user_member_of_event_club(
    user_id: int,
    event_id: int,
    dependent_id: Optional[int],
) -> bool:
    """
    Check if user has active membership for the event's club.
    Returns True only if membership status is 'active'.
    Handles both self (dependent_id IS NULL) and dependent memberships.
    """
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT 1
                FROM events e
                JOIN memberships m ON m.club_id = e.club_id
                WHERE e.id = :event_id
                  AND m.user_id = :user_id
                  AND m.status = 'active'
                  AND (
                    (:dependent_id IS NULL AND m.dependent_id IS NULL)
                    OR
                    (:dependent_id IS NOT NULL AND m.dependent_id = :dependent_id)
                  )
                LIMIT 1
                """
            ),
            {
                "event_id": event_id,
                "user_id": user_id,
                "dependent_id": dependent_id,
            },
        ).fetchone()

        return result is not None
