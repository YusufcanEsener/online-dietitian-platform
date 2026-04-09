from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import Member, Dietitian, User
from app.models.nutrition_plan import NutritionPlan
from app.schemas.user import UserResponse, DietitianResponse, MemberUpdate
from app.api.api_v1.endpoints.auth import get_current_user

router = APIRouter()


# Yardımcı: Sistemdeki tek diyetisyeni bul
async def get_the_dietitian() -> Dietitian:
    """Sistemdeki tek aktif diyetisyeni döndürür."""
    dietitian = await Dietitian.find_one(Dietitian.is_active == True)
    if not dietitian:
        raise HTTPException(status_code=503, detail="Sistemde aktif diyetisyen bulunamadı")
    return dietitian


@router.get("/me", response_model=UserResponse)
async def read_user_me(current_user: User = Depends(get_current_user)) -> Any:
    """Mevcut üyenin bilgilerini döndürür."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )

@router.get("/me/full")
async def read_member_me_full(current_user: User = Depends(get_current_user)) -> Any:
    """Mevcut üyenin tam bilgilerini döndürür."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Not a member")
    
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "is_active": current_user.is_active,
        "subscription_status": current_user.subscription_status,
        "height": current_user.height,
        "weight": current_user.weight,
        "target_weight": current_user.target_weight,
        "birth_date": str(current_user.birth_date) if current_user.birth_date else None,
        "gender": current_user.gender.value if current_user.gender else None,
        "activity_level": current_user.activity_level.value if current_user.activity_level else None,
        "phone": current_user.phone,
        "city": current_user.city,
    }

@router.put("/me")
async def update_user_me(
    update_data: MemberUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Üye profilini günceller."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Not a member")
    
    member = await Member.get(current_user.id)
    
    # Tüm sağlanan alanları güncelle
    if update_data.full_name is not None:
        member.full_name = update_data.full_name
    if update_data.height is not None:
        member.height = update_data.height
    if update_data.weight is not None:
        member.weight = update_data.weight
    if update_data.target_weight is not None:
        member.target_weight = update_data.target_weight
    if update_data.birth_date is not None:
        member.birth_date = update_data.birth_date
    if update_data.gender is not None:
        member.gender = update_data.gender
    if update_data.activity_level is not None:
        member.activity_level = update_data.activity_level
    if update_data.phone is not None:
        member.phone = update_data.phone
    if update_data.city is not None:
        member.city = update_data.city
    
    await member.save()
    
    return {
        "id": str(member.id),
        "email": member.email,
        "full_name": member.full_name,
        "role": member.role.value if hasattr(member.role, 'value') else member.role,
        "is_active": member.is_active,
        "subscription_status": member.subscription_status,
        "height": member.height,
        "weight": member.weight,
        "target_weight": member.target_weight,
        "birth_date": str(member.birth_date) if member.birth_date else None,
        "gender": member.gender.value if member.gender else None,
        "activity_level": member.activity_level.value if member.activity_level else None,
        "phone": member.phone,
        "city": member.city,
    }

@router.get("/my-dietitian", response_model=DietitianResponse)
async def get_my_dietitian(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Sistemdeki tek diyetisyeni döndürür (tüm üyeler aynı diyetisyene bağlı)."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Only members can view dietitian")
    
    dietitian = await get_the_dietitian()
    
    return DietitianResponse(
        id=str(dietitian.id),
        email=dietitian.email,
        full_name=dietitian.full_name,
        role=dietitian.role,
        is_active=dietitian.is_active,
        title=dietitian.title,
        specialization=dietitian.specialization,
        experience_years=dietitian.experience_years,
        bio=dietitian.bio
    )

@router.get("/my-plan")
async def get_my_nutrition_plan(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Üyenin aktif beslenme programını döndürür."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Not a member")
    
    plan = await NutritionPlan.find_one(
        NutritionPlan.member_id == str(current_user.id),
        NutritionPlan.is_active == True
    )
    
    if not plan:
        raise HTTPException(status_code=404, detail="No active nutrition plan")
    
    return {
        "id": str(plan.id),
        "dietitian_id": plan.dietitian_id,
        "title": plan.title,
        "description": plan.description,
        "start_date": str(plan.start_date),
        "end_date": str(plan.end_date) if plan.end_date else None,
        "daily_targets": {
            "calories": plan.daily_targets.calories,
            "protein": plan.daily_targets.protein,
            "carbs": plan.daily_targets.carbs,
            "fat": plan.daily_targets.fat,
            "water": plan.daily_targets.water,
        },
        "meals": [
            {
                "meal_type": m.meal_type.value,
                "foods": m.foods,
                "notes": m.notes,
                "time": m.time,
            } for m in plan.meals
        ],
        "notes": plan.notes,
    }
