from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
from app.models.user import User, Dietitian, Member, UserRole
from app.models.nutrition_plan import NutritionPlan, Meal, DailyTargets
from app.models.notification import Notification, NotificationType
from app.schemas.nutrition_plan import (
    NutritionPlanCreate, NutritionPlanUpdate, NutritionPlanResponse,
    MealResponse, DailyTargetsResponse
)
from app.api.api_v1.endpoints.auth import get_current_user

router = APIRouter()

async def get_dietitian_user(current_user: User = Depends(get_current_user)) -> Dietitian:
    """Diyetisyen kullanıcısını doğrular."""
    if current_user.role != UserRole.DIETITIAN:
        raise HTTPException(status_code=403, detail="Dietitian access required")
    return current_user

@router.get("/stats")
async def get_dietitian_stats(
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Diyetisyen istatistiklerini döndürür."""
    # Tek diyetisyen modeli: tüm üyeler bu diyetisyene ait
    all_members = await Member.find(Member.is_active == True).to_list()
    total_members = len(all_members)
    
    # Aktif abonelik olan üyeler
    active_members = len([m for m in all_members if m.subscription_status])
    
    # Aktif beslenme programları
    active_plans = await NutritionPlan.find(
        NutritionPlan.is_active == True
    ).count()
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "active_plans": active_plans,
    }

@router.get("/my-members")
async def get_my_members(
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Tüm üyeleri listeler (tek diyetisyen modeli)."""
    members = await Member.find(Member.is_active == True).to_list()
    
    result = []
    for m in members:
        # Aktif plan var mı?
        active_plan = await NutritionPlan.find_one(
            NutritionPlan.member_id == str(m.id),
            NutritionPlan.is_active == True
        )
        
        result.append({
            "id": str(m.id),
            "email": m.email,
            "full_name": m.full_name,
            "subscription_status": m.subscription_status,
            "weight": m.weight,
            "height": m.height,
            "target_weight": m.target_weight,
            "has_active_plan": active_plan is not None,
        })
    
    return result

@router.get("/member/{member_id}")
async def get_member_detail(
    member_id: str,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Danışan detaylarını döndürür — kilo geçmişi, tüm planlar, günlük loglar dahil."""
    from app.models.daily_log import DailyLog
    
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Tüm beslenme planları (aktif ve pasif)
    all_plans = await NutritionPlan.find(
        NutritionPlan.member_id == member_id
    ).sort(-NutritionPlan.created_at).to_list()
    
    plans_data = []
    for p in all_plans:
        plans_data.append({
            "id": str(p.id),
            "title": p.title,
            "description": p.description,
            "start_date": str(p.start_date),
            "end_date": str(p.end_date) if p.end_date else None,
            "is_active": p.is_active,
            "daily_targets": {
                "calories": p.daily_targets.calories,
                "protein": p.daily_targets.protein,
                "carbs": p.daily_targets.carbs,
                "fat": p.daily_targets.fat,
                "water": p.daily_targets.water,
            },
            "created_at": str(p.created_at),
        })
    
    # Günlük loglar (son 30 gün)
    daily_logs = await DailyLog.find(
        DailyLog.member_id == member_id
    ).sort(-DailyLog.log_date).limit(30).to_list()
    
    logs_data = []
    for log in daily_logs:
        logs_data.append({
            "date": str(log.log_date),
            "calories_consumed": log.calories_consumed,
            "calories_target": log.calories_target,
            "protein_consumed": log.protein,
            "carbs_consumed": log.carbs,
            "fat_consumed": log.fat,
            "water_consumed": log.water_glasses,
        })
    
    # Aktif plan
    active_plan = next((p for p in plans_data if p["is_active"]), None)
    
    return {
        "id": str(member.id),
        "email": member.email,
        "full_name": member.full_name,
        "subscription_status": member.subscription_status,
        "weight": member.weight,
        "height": member.height,
        "target_weight": member.target_weight,
        "gender": member.gender.value if member.gender else None,
        "activity_level": member.activity_level.value if member.activity_level else None,
        "birth_date": str(member.birth_date) if member.birth_date else None,
        "active_plan": active_plan,
        "all_plans": plans_data,
        "daily_logs": logs_data,
    }


@router.post("/nutrition-plans", response_model=NutritionPlanResponse)
async def create_nutrition_plan(
    plan_in: NutritionPlanCreate,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Yeni beslenme programı oluşturur."""
    member = await Member.get(plan_in.member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Mevcut aktif planı deaktive et
    existing_plans = await NutritionPlan.find(
        NutritionPlan.member_id == plan_in.member_id,
        NutritionPlan.is_active == True
    ).to_list()
    for ep in existing_plans:
        ep.is_active = False
        await ep.save()
    
    # Yeni plan oluştur
    meals = [Meal(**m.dict()) for m in plan_in.meals]
    new_plan = NutritionPlan(
        dietitian_id=str(current_user.id),
        member_id=plan_in.member_id,
        title=plan_in.title,
        description=plan_in.description,
        start_date=datetime.combine(plan_in.start_date, datetime.min.time()),
        end_date=datetime.combine(plan_in.end_date, datetime.min.time()) if plan_in.end_date else None,
        daily_targets=DailyTargets(**plan_in.daily_targets.dict()),
        meals=meals,
        notes=plan_in.notes,
    )
    
    print("----- DEBUG NEW PLAN TYPES -----", flush=True)
    for k, v in new_plan.__dict__.items():
        print(f"{k}: {type(v)}", flush=True)
    print("--------------------------------", flush=True)

    await new_plan.insert()

    # --- Üyeye bildirim gönder ---
    await Notification(
        user_id=plan_in.member_id,
        sender_name=current_user.full_name or "Diyetisyeniniz",
        title="📋 Yeni Beslenme Programı",
        message=f"Diyetisyeniniz '{new_plan.title}' başlıklı yeni bir beslenme programı oluşturdu.",
        type=NotificationType.SUCCESS,
    ).insert()

    return NutritionPlanResponse(
        id=str(new_plan.id),
        dietitian_id=new_plan.dietitian_id,
        member_id=new_plan.member_id,
        title=new_plan.title,
        description=new_plan.description,
        start_date=new_plan.start_date,
        end_date=new_plan.end_date,
        is_active=new_plan.is_active,
        daily_targets=DailyTargetsResponse(**new_plan.daily_targets.dict()),
        meals=[MealResponse(**m.dict()) for m in new_plan.meals],
        notes=new_plan.notes,
    )

@router.get("/nutrition-plans/{plan_id}", response_model=NutritionPlanResponse)
async def get_nutrition_plan(
    plan_id: str,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Beslenme programı detayını döndürür."""
    plan = await NutritionPlan.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return NutritionPlanResponse(
        id=str(plan.id),
        dietitian_id=plan.dietitian_id,
        member_id=plan.member_id,
        title=plan.title,
        description=plan.description,
        start_date=plan.start_date,
        end_date=plan.end_date,
        is_active=plan.is_active,
        daily_targets=DailyTargetsResponse(**plan.daily_targets.dict()),
        meals=[MealResponse(**m.dict()) for m in plan.meals],
        notes=plan.notes,
    )

@router.put("/nutrition-plans/{plan_id}", response_model=NutritionPlanResponse)
async def update_nutrition_plan(
    plan_id: str,
    plan_update: NutritionPlanUpdate,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Beslenme programını günceller."""
    plan = await NutritionPlan.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if plan_update.title is not None:
        plan.title = plan_update.title
    if plan_update.description is not None:
        plan.description = plan_update.description
    if plan_update.end_date is not None:
        plan.end_date = datetime.combine(plan_update.end_date, datetime.min.time())
    if plan_update.is_active is not None:
        plan.is_active = plan_update.is_active
    if plan_update.daily_targets is not None:
        plan.daily_targets = DailyTargets(**plan_update.daily_targets.dict())
    if plan_update.meals is not None:
        plan.meals = [Meal(**m.dict()) for m in plan_update.meals]
    if plan_update.notes is not None:
        plan.notes = plan_update.notes
    
    plan.updated_at = datetime.utcnow()
    await plan.save()

    # --- Üyeye bildirim gönder ---
    await Notification(
        user_id=plan.member_id,
        sender_name=current_user.full_name or "Diyetisyeniniz",
        title="✏️ Beslenme Programı Güncellendi",
        message=f"Diyetisyeniniz '{plan.title}' başlıklı beslenme programınızı düzenledi.",
        type=NotificationType.INFO,
    ).insert()

    return NutritionPlanResponse(
        id=str(plan.id),
        dietitian_id=plan.dietitian_id,
        member_id=plan.member_id,
        title=plan.title,
        description=plan.description,
        start_date=plan.start_date,
        end_date=plan.end_date,
        is_active=plan.is_active,
        daily_targets=DailyTargetsResponse(**plan.daily_targets.dict()),
        meals=[MealResponse(**m.dict()) for m in plan.meals],
        notes=plan.notes,
    )

@router.delete("/nutrition-plans/{plan_id}")
async def delete_nutrition_plan(
    plan_id: str,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Beslenme programını siler."""
    plan = await NutritionPlan.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    await plan.delete()
    return {"message": "Plan deleted", "id": plan_id}


@router.post("/member/{member_id}/save-calories")
async def save_member_calories(
    member_id: str,
    calorie_data: dict,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Danışan için hesaplanan kalori bilgilerini kaydeder."""
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # Kalori alanlarını güncelle
    member.calculated_bmr = calorie_data.get("bmr")
    member.calculated_tdee = calorie_data.get("tdee")
    member.calculated_target_calories = calorie_data.get("target_calories")
    member.calculated_protein = calorie_data.get("protein")
    member.calculated_carbs = calorie_data.get("carbs")
    member.calculated_fat = calorie_data.get("fat")
    member.calorie_goal = calorie_data.get("goal")
    member.calorie_calculated_at = datetime.utcnow()
    
    await member.save()
    
    return {
        "success": True,
        "message": "Kalori bilgileri kaydedildi",
        "data": {
            "member_id": member_id,
            "calculated_bmr": member.calculated_bmr,
            "calculated_tdee": member.calculated_tdee,
            "calculated_target_calories": member.calculated_target_calories,
            "calculated_protein": member.calculated_protein,
            "calculated_carbs": member.calculated_carbs,
            "calculated_fat": member.calculated_fat,
            "calorie_goal": member.calorie_goal,
            "calorie_calculated_at": str(member.calorie_calculated_at)
        }
    }


@router.get("/member/{member_id}/calories")
async def get_member_calories(
    member_id: str,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """Danışan için kayıtlı kalori bilgilerini döndürür."""
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    if not member.calorie_calculated_at:
        return {"success": False, "message": "Kalori bilgisi bulunamadı"}
    
    return {
        "success": True,
        "data": {
            "member_id": member_id,
            "member_name": member.full_name,
            "calculated_bmr": member.calculated_bmr,
            "calculated_tdee": member.calculated_tdee,
            "calculated_target_calories": member.calculated_target_calories,
            "calculated_protein": member.calculated_protein,
            "calculated_carbs": member.calculated_carbs,
            "calculated_fat": member.calculated_fat,
            "calorie_goal": member.calorie_goal,
            "calorie_calculated_at": str(member.calorie_calculated_at)
        }
    }
