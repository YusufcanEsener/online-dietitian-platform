from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class DailyLog(Document):
    """Kullanıcının günlük kalori, makro ve su takibi"""
    member_id: str
    log_date: str
    calories_consumed: int = 0
    calories_target: int = 2000
    protein: int = 0  # gram
    protein_target: int = 120
    carbs: int = 0  # gram
    carbs_target: int = 250
    fat: int = 0  # gram
    fat_target: int = 65
    water_glasses: int = 0
    water_target: int = 8
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "daily_logs"
