from typing import Optional, List, Union, Any
from beanie import Document
from pydantic import BaseModel, Field, field_validator
from datetime import datetime, date
from enum import Enum

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

class Food(BaseModel):
    """Yiyecek bilgisi"""
    name: str
    amount: Optional[str] = None  # "100g", "1 porsiyon", "2 adet" vb.

class Meal(BaseModel):
    """Öğün bilgisi"""
    meal_type: MealType
    foods: List[Food] = []
    notes: Optional[str] = None
    time: Optional[str] = None  # "08:00"
    
    @field_validator('foods', mode='before')
    @classmethod
    def convert_string_foods(cls, v: Any) -> List[Any]:
        """Eski string formatındaki foods'ları Food objesine dönüştür"""
        if not v:
            return []
        
        result = []
        for item in v:
            if isinstance(item, str):
                # Eski format: sadece string
                result.append({"name": item, "amount": None})
            elif isinstance(item, dict):
                # Yeni format: dict
                result.append(item)
            else:
                result.append(item)
        return result


class DailyTargets(BaseModel):
    """Günlük hedefler"""
    calories: int = 2000
    protein: int = 120
    carbs: int = 250
    fat: int = 65
    water: int = 8

class NutritionPlan(Document):
    """Beslenme programı"""
    dietitian_id: str
    member_id: str
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    is_active: bool = True
    daily_targets: DailyTargets = Field(default_factory=DailyTargets)
    meals: List[Meal] = []
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "nutrition_plans"
