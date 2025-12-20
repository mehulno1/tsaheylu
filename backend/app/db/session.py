from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# CHANGE these values carefully
DATABASE_URL = "mysql+pymysql://dbusr_club:clubshub@localhost:3306/clubvision"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

