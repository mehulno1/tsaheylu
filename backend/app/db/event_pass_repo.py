import uuid
from sqlalchemy import text
from typing import Optional
from app.db.session import engine


def create_event_pass(event_id: int, user_id: int, dependent_id: Optional[int]):
    pass_code = str(uuid.uuid4())[:10]

    with engine.begin() as conn:
        # Check for duplicate pass: event_id, user_id, and dependent_id must all match
        # Handle NULL correctly: NULL = NULL only for self passes, non-NULL = non-NULL for dependent passes
        existing = conn.execute(
            text("""
                SELECT id FROM event_passes
                WHERE event_id = :event_id
                  AND user_id = :user_id
                  AND (
                    (:dependent_id IS NULL AND dependent_id IS NULL)
                    OR
                    (:dependent_id IS NOT NULL AND dependent_id = :dependent_id)
                  )
            """),
            {
                "event_id": event_id,
                "user_id": user_id,
                "dependent_id": dependent_id,
            },
        ).fetchone()

        if existing:
            raise ValueError("Pass already exists")

        conn.execute(
            text("""
                INSERT INTO event_passes (event_id, user_id, dependent_id, pass_code)
                VALUES (:event_id, :user_id, :dependent_id, :pass_code)
            """),
            {
                "event_id": event_id,
                "user_id": user_id,
                "dependent_id": dependent_id,
                "pass_code": pass_code,
            },
        )

    return {"pass_code": pass_code}


    
def get_passes_for_user(user_id: int) -> list[dict]:
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    ep.id,
                    ep.pass_code,
                    e.title AS event_title,
                    c.name AS club_name,
                    d.name AS dependent_name,
                    d.relation AS dependent_relation
                FROM event_passes ep
                JOIN events e ON e.id = ep.event_id
                JOIN clubs c ON c.id = e.club_id
                LEFT JOIN dependents d ON d.id = ep.dependent_id
                WHERE ep.user_id = :user_id
                ORDER BY e.event_date DESC
            """),
            {"user_id": user_id},
        )

        passes = []

        for row in result:
            r = row._mapping
            passes.append({
                "id": r["id"],
                "pass_code": r["pass_code"],
                "event_title": r["event_title"],
                "club_name": r["club_name"],
                "member": (
                    "Self"
                    if r["dependent_name"] is None
                    else f'{r["dependent_name"]} ({r["dependent_relation"]})'
                ),
            })

        return passes

def get_passes_for_user_event(event_id: int, user_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    dependent_id
                FROM event_passes
                WHERE event_id = :event_id
                  AND user_id = :user_id
            """),
            {
                "event_id": event_id,
                "user_id": user_id,
            },
        )

        # returns: [null, 2, 5]
        return [row._mapping["dependent_id"] for row in result]
