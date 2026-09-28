from pydantic import BaseModel ,Field ,EmailStr
from database import SessionLocal
from models import User
from fastapi import FastAPI,HTTPException
from pwdlib import PasswordHash
from fastapi.middleware.cors import CORSMiddleware

password_Hash = PasswordHash.recommended()

class UserCreate(BaseModel):
    name : str = Field(min_length =3)
    email : EmailStr
    password:str = Field(min_length=6)

class LoginRequest(BaseModel):
    email:EmailStr
    password:str 

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login")
def login(user:LoginRequest):
    db = SessionLocal()
    result = db.query(User).filter(User.email==user.email).first()
    if result is None:
        db.close()
        raise HTTPException(status_code=404 , detail="user not find")
    if not password_Hash.verify(user.password , result.password):
        db.close()
        raise HTTPException(status_code=401,detail="Invalid password")
    db.close()
    return{
        "message":"Login sucessful",
        "id":result.id,
        "email":result.email
    }
# path parameter ==> which specific user
@app.get("/users/{user_id}") 
def user(user_id: int):
    db = SessionLocal()
    result = db.query(User).filter(User.id == user_id).first()
    if result is None:
        raise HTTPException(status_code=404 , detail="User Not found")
    return {"id":result.id ,
            "name": result.name,
            "email":result.email}

# Query parameter ==> what condition filter, option

@app.put("/users/{user_id}")
def update_user(user_id : int ,user :UserCreate):
    db = SessionLocal()
    result = db.query(User).filter(User.id ==user_id).first()
    if result is None:
        raise HTTPException(status_code=404 , detail="user not find")
    result.name = user.name
    result.email = user.email
    db.commit()
    db.close()
    return {
    "id": result.id,
    "name": result.name,
    "email": result.email
    }


@app.delete("/user/{user_id}")
def delete_user(user_id : int):
    db =SessionLocal()
    result= db.query(User).filter(User.id == user_id).first()
    if result is None:
        raise HTTPException(status_code=404,detail="not found")
    db.delete(result)
    db.commit()
    db.close()
    return {"message": "User delete successfully"}


@app.get("/products")
def prod(limit:int):
    return{"limit":limit}

@app.post("/users")
def create_user(user : UserCreate):
    hashed_password = password_Hash.hash(user.password)
    db = SessionLocal()

    new_user=User(
        name = user.name,
        email=user.email,
        password =hashed_password
        )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.close()
    return{
        "id":new_user.id,
        "name":new_user.name,
        "email":new_user.email
    }
    
    
    


    