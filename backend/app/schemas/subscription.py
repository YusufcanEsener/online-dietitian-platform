from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class PlanBase(BaseModel):
    name: str
    price: float
    duration_days: int
    features: str

class PlanCreate(PlanBase):
    pass

class PlanResponse(PlanBase):
    id: str

class SubscriptionResponse(BaseModel):
    id: str
    plan_id: str
    start_date: datetime
    end_date: datetime
    is_active: bool
