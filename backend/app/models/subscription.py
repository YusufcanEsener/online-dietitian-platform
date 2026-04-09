from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class SubscriptionPlan(Document):
    name: str
    price: float
    duration_days: int
    features: str
    
    class Settings:
        name = "subscription_plans"

class UserSubscription(Document):
    user_id: str
    plan_id: str
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: datetime
    is_active: bool = True
    
    class Settings:
        name = "user_subscriptions"
