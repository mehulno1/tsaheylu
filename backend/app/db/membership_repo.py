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
