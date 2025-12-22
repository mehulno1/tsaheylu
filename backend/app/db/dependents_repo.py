from app.db.session import SessionLocal
from sqlalchemy import text


def create_dependent(user_id: int, name: str, relation: str, date_of_birth=None):
    db = SessionLocal()
    try:
        db.execute(
            text(
                """
                INSERT INTO dependents (user_id, name, relation, date_of_birth)
                VALUES (:user_id, :name, :relation, :dob)
                """
            ),
            {
                "user_id": user_id,
                "name": name,
                "relation": relation,
                "dob": date_of_birth,
            },
        )
        db.commit()
    finally:
        db.close()


def get_dependents_for_user(user_id: int):
    db = SessionLocal()
    try:
        result = db.execute(
            text(
                """
                SELECT id, name, relation, date_of_birth, created_at
                FROM dependents
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                """
            ),
            {"user_id": user_id},
        )
        return [dict(row._mapping) for row in result]
    finally:
        db.close()
