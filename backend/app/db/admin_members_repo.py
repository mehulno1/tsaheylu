from sqlalchemy import text
from app.db.session import engine


def get_all_members_for_club(club_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    m.id,
                    u.phone_number,
                    m.status,
                    m.rejection_reason,
                    d.name AS dependent_name,
                    d.relation AS dependent_relation
                FROM memberships m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN dependents d ON d.id = m.dependent_id
                WHERE m.club_id = :club_id
                ORDER BY u.phone_number
            """),
            {"club_id": club_id},
        )

        members = []

        for row in result:
            r = row._mapping
            members.append({
                "membership_id": r["id"],
                "phone": r["phone_number"],
                "member_type": "self" if r["dependent_name"] is None else "dependent",
                "name": r["dependent_name"],
                "relation": r["dependent_relation"],
                "status": r["status"],
                "rejection_reason": r["rejection_reason"],
            })

        return members
