from typing import Optional, List
from pydantic import BaseModel
from datetime import date
from app.models.nutrition_plan import MealType

class FoodCreate(BaseModel):
    name: str
    amount: Optional[str] = None  # "100g", "1 porsiyon", "2 adet" vb.

class MealCreate(BaseModel):
    meal_type: MealType
    foods: List[FoodCreate] = []
    notes: Optional[str] = None
    time: Optional[str] = None

class DailyTargetsCreate(BaseModel):
    calories: int = 2000
    protein: int = 120
    carbs: int = 250
    fat: int = 65
    water: int = 8

class NutritionPlanCreate(BaseModel):
    member_id: str
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    daily_targets: DailyTargetsCreate = DailyTargetsCreate()
    meals: List[MealCreate] = []
    notes: Optional[str] = None

class NutritionPlanUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    daily_targets: Optional[DailyTargetsCreate] = None
    meals: Optional[List[MealCreate]] = None
    notes: Optional[str] = None

class FoodResponse(BaseModel):
    name: str
    amount: Optional[str]

class MealResponse(BaseModel):
    meal_type: str
    foods: List[FoodResponse]
    notes: Optional[str]
    time: Optional[str]


class DailyTargetsResponse(BaseModel):
    calories: int
    protein: int
    carbs: int
    fat: int
    water: int

class NutritionPlanResponse(BaseModel):
    id: str
    dietitian_id: str
    member_id: str
    title: str
    description: Optional[str]
    start_date: date
    end_date: Optional[date]
    is_active: bool
    daily_targets: DailyTargetsResponse
    meals: List[MealResponse]
    notes: Optional[str]
