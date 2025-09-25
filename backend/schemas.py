from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    # is_adminフィールドを削除（セキュリティ強化）

class UserResponse(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    is_admin: Optional[bool] = None
    is_active: Optional[bool] = None

class MedicationRecordBase(BaseModel):
    date: date
    morning_taken: bool = False
    afternoon_taken: bool = False
    evening_taken: bool = False
    notes: Optional[str] = None

class MedicationRecordCreate(MedicationRecordBase):
    pass

class MedicationRecordResponse(MedicationRecordBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
