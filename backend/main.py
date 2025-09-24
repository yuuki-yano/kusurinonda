from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import os

from database import SessionLocal, engine
from models import User, MedicationRecord
from schemas import UserCreate, UserResponse, UserUpdate, MedicationRecordCreate, MedicationRecordResponse
from auth import authenticate_user, create_access_token, get_password_hash, get_current_user
import models

models.Base.metadata.create_all(bind=engine)

# 本番環境ではdocsを無効にする
is_production = os.getenv("PRODUCTION", "false").lower() == "true"

app = FastAPI(
    title="薬飲み忘れ管理API",
    description="薬を飲んだかどうかを管理するWebアプリのAPI",
    version="1.0.0",
    docs_url=None if is_production else "/docs",
    redoc_url=None if is_production else "/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        hashed_password=hashed_password,
        is_admin=user.is_admin if user.is_admin else False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/users", response_model=list[UserResponse])
async def read_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(User).all()

@app.post("/medication-records", response_model=MedicationRecordResponse)
async def create_medication_record(
    record: MedicationRecordCreate, 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    db_record = MedicationRecord(
        user_id=current_user.id,
        date=record.date,
        morning_taken=record.morning_taken,
        afternoon_taken=record.afternoon_taken,
        evening_taken=record.evening_taken,
        notes=record.notes
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/medication-records", response_model=list[MedicationRecordResponse])
async def read_medication_records(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    return db.query(MedicationRecord).filter(MedicationRecord.user_id == current_user.id).all()

@app.put("/medication-records/{record_id}", response_model=MedicationRecordResponse)
async def update_medication_record(
    record_id: int,
    record: MedicationRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_record = db.query(MedicationRecord).filter(
        MedicationRecord.id == record_id,
        MedicationRecord.user_id == current_user.id
    ).first()
    
    if not db_record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    db_record.morning_taken = record.morning_taken
    db_record.afternoon_taken = record.afternoon_taken
    db_record.evening_taken = record.evening_taken
    db_record.notes = record.notes
    
    db.commit()
    db.refresh(db_record)
    return db_record

# 管理者用ユーザー管理エンドポイント
@app.put("/admin/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_update.is_admin is not None:
        db_user.is_admin = user_update.is_admin
    if user_update.is_active is not None:
        db_user.is_active = user_update.is_active
    
    db.commit()
    db.refresh(db_user)
    return db_user

# 過去の記録取得（3日分）
@app.get("/medication-records/recent", response_model=list[MedicationRecordResponse])
async def get_recent_records(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    from datetime import date, timedelta
    
    end_date = date.today()
    start_date = end_date - timedelta(days=2)  # 3日分（今日含む）
    
    records = db.query(MedicationRecord).filter(
        MedicationRecord.user_id == current_user.id,
        MedicationRecord.date >= start_date,
        MedicationRecord.date <= end_date
    ).order_by(MedicationRecord.date.desc()).all()
    
    return records

@app.get("/admin/medication-records", response_model=list[MedicationRecordResponse])
async def read_all_medication_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(MedicationRecord).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
