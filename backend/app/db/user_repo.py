from typing import Optional
from sqlalchemy import text
from app.db.session import engine


def get_user_by_phone(phone: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT id, phone_number, full_name FROM users WHERE phone_number = :phone"),
            {"phone": phone},
        )
        return result.fetchone()


def update_user_name_if_null(user_id: int, name: str):
    """
    Update user name only if it is currently null.
    """
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users
                SET full_name = :name
                WHERE id = :user_id
                  AND full_name IS NULL
            """),
            {
                "user_id": user_id,
                "name": name,
            },
        )


def create_user(phone: str, name: Optional[str] = None):
    """
    Create a new user. Optionally set name if provided.
    """
    with engine.begin() as conn:
        if name:
            result = conn.execute(
                text(
                    "INSERT INTO users (phone_number, full_name) VALUES (:phone, :name)"
                ),
                {"phone": phone, "name": name},
            )
        else:
            result = conn.execute(
                text(
                    "INSERT INTO users (phone_number) VALUES (:phone)"
                ),
                {"phone": phone},
            )
        return result.lastrowid
