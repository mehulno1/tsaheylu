from sqlalchemy import text
from app.db.session import engine


def get_user_by_phone(phone: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT id, phone_number FROM users WHERE phone_number = :phone"),
            {"phone": phone},
        )
        return result.fetchone()


def create_user(phone: str):
    with engine.begin() as conn:
        result = conn.execute(
            text(
                "INSERT INTO users (phone_number) VALUES (:phone)"
            ),
            {"phone": phone},
        )
        return result.lastrowid
