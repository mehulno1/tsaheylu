from sqlalchemy import text
from typing import Optional
from app.db.session import engine


def create_event(
    club_id: int,
    title: str,
    description: Optional[str],
    event_date: str,
    location: Optional[str],
    requires_pass: bool,
):
    with engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO events (
                    club_id,
                    title,
                    description,
                    event_date,
                    location,
                    requires_pass
                )
                VALUES (
                    :club_id,
                    :title,
                    :description,
                    :event_date,
                    :location,
                    :requires_pass
                )
            """),
            {
                "club_id": club_id,
                "title": title,
                "description": description,
                "event_date": event_date,
                "location": location,
                "requires_pass": requires_pass,
            },
        )
        conn.commit()


def get_events_for_club(club_id: int):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT
                    id,
                    title,
                    description,
                    event_date,
                    location,
                    requires_pass
                FROM events
                WHERE club_id = :club_id
                ORDER BY event_date ASC
            """),
            {"club_id": club_id},
        )
        return [dict(row._mapping) for row in result]
