from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import date
from app.models.user import UserRole, ActivityLevel, Gender

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.MEMBER

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None

class AdminUserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    
    class Config:
        from_attributes = True

class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    target_weight: Optional[float] = None
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None
    activity_level: Optional[ActivityLevel] = None
    phone: Optional[str] = None
    city: Optional[str] = None

class MemberResponse(UserResponse):
    subscription_status: bool = False
    height: Optional[float] = None
    weight: Optional[float] = None
    target_weight: Optional[float] = None
    birth_date: Optional[date] = None
    gender: Optional[Gender] = None
    activity_level: Optional[ActivityLevel] = None
    phone: Optional[str] = None
    city: Optional[str] = None



class DietitianUpdate(BaseModel):
    title: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    full_name: Optional[str] = None
    
class DietitianCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    title: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: int = 0
    bio: Optional[str] = None

class DietitianResponse(UserResponse):
    title: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: int = 0
    bio: Optional[str] = None


