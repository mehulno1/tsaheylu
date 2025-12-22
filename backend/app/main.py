from fastapi import FastAPI
from app.db.session import engine
from sqlalchemy import text
from app.routers import auth
from app.routers import clubs
from app.routers import announcements
from app.routers import dependents

app = FastAPI(title="Club Vision API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/db-test")
def db_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {"db": result.scalar()}

app.include_router(auth.router)
app.include_router(clubs.router)
app.include_router(announcements.router)
app.include_router(dependents.router)