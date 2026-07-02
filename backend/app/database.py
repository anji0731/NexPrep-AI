from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import settings

DATABASE_URL = settings.DATABASE_URL.strip()

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable must be set to a PostgreSQL connection string.")

# Configure connection pooling for production PostgreSQL (Supabase)
engine = create_engine(
    DATABASE_URL,
    pool_size=10,            # Keep up to 10 connections open in the pool
    max_overflow=20,         # Allow up to 20 additional connections during spikes
    pool_timeout=30,         # Wait up to 30 seconds for a connection from the pool
    pool_recycle=1800,       # Recycle connections after 30 minutes to avoid stale connection errors
    pool_pre_ping=True,      # Check connection liveness on checkout
    future=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
