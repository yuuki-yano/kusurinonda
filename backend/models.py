from sqlalchemy import create_engine, Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)  # ユーザーBAN機能用
    created_at = Column(DateTime, default=datetime.utcnow)

    medication_records = relationship("MedicationRecord", back_populates="user")

class MedicationRecord(Base):
    __tablename__ = "medication_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(Date)
    morning_taken = Column(Boolean, default=False)
    afternoon_taken = Column(Boolean, default=False)
    evening_taken = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)  # 備考欄
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="medication_records")
