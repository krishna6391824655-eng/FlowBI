from sqlalchemy.orm import declarative_base 
from sqlalchemy import Column ,Integer,String ,Text,DateTime, ForeignKey, inspect, text
from database import engine
from datetime import datetime
from zoneinfo import ZoneInfo

Base = declarative_base()

# Base kya hai?
# Base ko SQLAlchemy ke liye parent/base class samjho. Iske through hum Python classes ko database tables ke saath map karenge.
class User(Base):
    __tablename__="users"
    id = Column(Integer , primary_key = True)
    name = Column(String)
    email = Column(String )
    password =Column(String)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(Integer, nullable=False)
    used_at = Column(Integer, nullable=True)
    created_at = Column(Integer, nullable=False, default=lambda: int(datetime.now().timestamp()))


class Dataset(Base):

    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, nullable=False)

    name = Column(String, nullable=False)

    data = Column(Text, nullable=False)

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(
            ZoneInfo("Asia/Kolkata")
        )
    )

    # =========================================================
# PIPELINE RUNS TABLE
# =========================================================


class PipelineRun(Base):

    __tablename__ = "pipeline_runs"

    id = Column(
        Integer,
        primary_key=True
    )

    user_id = Column(
        Integer,
        nullable=True
    )

    dataset_name = Column(
        String,
        nullable=False
    )

    operations = Column(
        Text,
        nullable=False
    )

    status = Column(
        String,
        default="completed"
    )

    original_rows = Column(
        Integer,
        default=0
    )

    final_rows = Column(
        Integer,
        default=0
    )

    duplicates_removed = Column(
        Integer,
        default=0
    )

    missing_values_handled = Column(
        Integer,
        default=0
    )

    result_json = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=lambda:datetime.now(ZoneInfo("Asia/kolkata")
        )
    )


Base.metadata.create_all(bind = engine)

# create_all creates new tables but does not add columns to existing tables.
if "pipeline_runs" in inspect(engine).get_table_names():
    existing_columns = {column["name"] for column in inspect(engine).get_columns("pipeline_runs")}
    if "result_json" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE pipeline_runs ADD COLUMN result_json TEXT"))
