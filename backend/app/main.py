from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.db.session import engine
from sqlalchemy import text
from app.routers import auth
from app.routers import clubs
from app.routers import announcements
from app.routers import dependents
from app.routers import admin_memberships
from app.routers import admin_events
from app.routers import events
from app.routers import event_passes
from app.routers import admin_club_members
from app.routers import admin_clubs
from app.routers import admin_bulk_upload
from dotenv import load_dotenv
import os
load_dotenv()
print(os.getenv("TEST_OTP_MODE"))
print(os.getenv("TEST_OTP_CODE"))


app = FastAPI(title="Club Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
app.include_router(admin_memberships.router)
app.include_router(admin_events.router)
app.include_router(events.router)
app.include_router(event_passes.router)
app.include_router(admin_club_members.router)
app.include_router(admin_clubs.router)
app.include_router(admin_bulk_upload.router)