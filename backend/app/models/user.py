from typing import Optional
from beanie import Document
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    DIETITIAN = "dietitian"
    MEMBER = "member"

class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class User(Document):
    email: EmailStr = Field(unique=True)
    hashed_password: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    password_changed_at: Optional[datetime] = None

    class Settings:
        name = "users"

class Dietitian(User):
    title: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: int = 0
    bio: Optional[str] = None
    
    class Settings:
        name = "dietitians"

class Member(User):
    subscription_status: bool = False
    # Profile fields
    height: Optional[float] = None  # cm
    weight: Optional[float] = None  # kg
    target_weight: Optional[float] = None  # kg
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None
    activity_level: Optional[ActivityLevel] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    
    # Calculated calorie fields (saved by dietitian)
    calculated_bmr: Optional[int] = None
    calculated_tdee: Optional[int] = None
    calculated_target_calories: Optional[int] = None
    calculated_protein: Optional[int] = None
    calculated_carbs: Optional[int] = None
    calculated_fat: Optional[int] = None
    calorie_goal: Optional[str] = None  # 'lose', 'maintain', 'gain'
    calorie_calculated_at: Optional[datetime] = None
    
    class Settings:
        name = "members"


