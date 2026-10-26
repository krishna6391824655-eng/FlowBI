from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing from the backend environment.")
# Neon and most managed PostgreSQL providers expose a plain `postgresql://`
# URL. Use the psycopg2 driver that is pinned in requirements.txt.
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
engine_options = {"connect_args": {"check_same_thread": False}} if DATABASE_URL.startswith("sqlite") else {
    # Managed PostgreSQL providers can close idle connections while the app is
    # asleep or between requests. Validate pooled connections before reuse and
    # periodically replace them so auth and pipeline requests don't inherit a
    # stale socket.
    "pool_pre_ping": True,
    "pool_recycle": 300,
}
engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal =sessionmaker(bind=engine)







with engine.connect() as connection:
    print("database connect")
