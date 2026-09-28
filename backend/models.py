from sqlalchemy.orm import declarative_base 
from sqlalchemy import Column ,Integer,String
from database import engine

Base = declarative_base()

# Base kya hai?
# Base ko SQLAlchemy ke liye parent/base class samjho. Iske through hum Python classes ko database tables ke saath map karenge.
class User(Base):
    __tablename__="users"
    id = Column(Integer , primary_key = True)
    name = Column(String)
    email = Column(String )
    password =Column(String)

Base.metadata.create_all(bind = engine)