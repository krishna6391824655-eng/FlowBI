from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
DATABASE_URL = "postgresql://postgres:Krishna#123@localhost:5432/flowbi"
engine = create_engine(DATABASE_URL)
SessionLocal =sessionmaker(bind=engine)







with engine.connect() as connection:
    print("database connect")