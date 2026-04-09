from typing import Optional
from pydantic import BaseModel
from datetime import date

class DailyLogUpdate(BaseModel):
    calories_consumed: Optional[int] = None
    calories_target: Optional[int] = None
    protein: Optional[int] = None
    protein_target: Optional[int] = None
    carbs: Optional[int] = None
    carbs_target: Optional[int] = None
    fat: Optional[int] = None
    fat_target: Optional[int] = None
    water_glasses: Optional[int] = None
    water_target: Optional[int] = None

class DailyLogResponse(BaseModel):
    id: str
    member_id: str
    log_date: date
    calories_consumed: int
    calories_target: int
    protein: int
    protein_target: int
    carbs: int
    carbs_target: int
    fat: int
    fat_target: int
    water_glasses: int
    water_target: int
