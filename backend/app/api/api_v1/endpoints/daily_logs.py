from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime
from app.models.user import Member, User
from app.models.daily_log import DailyLog
from app.schemas.daily_log import DailyLogUpdate, DailyLogResponse
from app.api.api_v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/today", response_model=DailyLogResponse)
async def get_today_log(current_user: User = Depends(get_current_user)) -> Any:
    """Bugünkü günlük veriyi döndürür, yoksa oluşturur."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Not a member")
    
    today = date.today().isoformat()
    log = await DailyLog.find_one(DailyLog.member_id == str(current_user.id), DailyLog.log_date == today)
    
    if not log:
        log = DailyLog(
            member_id=str(current_user.id),
            log_date=today,
        )
        await log.insert()
    
    return DailyLogResponse(
        id=str(log.id),
        member_id=log.member_id,
        log_date=log.log_date,
        calories_consumed=log.calories_consumed,
        calories_target=log.calories_target,
        protein=log.protein,
        protein_target=log.protein_target,
        carbs=log.carbs,
        carbs_target=log.carbs_target,
        fat=log.fat,
        fat_target=log.fat_target,
        water_glasses=log.water_glasses,
        water_target=log.water_target,
    )

@router.put("/today", response_model=DailyLogResponse)
async def update_today_log(
    update_data: DailyLogUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Bugünkü günlük veriyi günceller."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Not a member")
    
    today = date.today().isoformat()
    log = await DailyLog.find_one(DailyLog.member_id == str(current_user.id), DailyLog.log_date == today)
    
    if not log:
        log = DailyLog(
            member_id=str(current_user.id),
            log_date=today,
        )
        await log.insert()
    
    # Update fields
    if update_data.calories_consumed is not None:
        log.calories_consumed = update_data.calories_consumed
    if update_data.calories_target is not None:
        log.calories_target = update_data.calories_target
    if update_data.protein is not None:
        log.protein = update_data.protein
    if update_data.protein_target is not None:
        log.protein_target = update_data.protein_target
    if update_data.carbs is not None:
        log.carbs = update_data.carbs
    if update_data.carbs_target is not None:
        log.carbs_target = update_data.carbs_target
    if update_data.fat is not None:
        log.fat = update_data.fat
    if update_data.fat_target is not None:
        log.fat_target = update_data.fat_target
    if update_data.water_glasses is not None:
        log.water_glasses = update_data.water_glasses
    if update_data.water_target is not None:
        log.water_target = update_data.water_target
    
    log.updated_at = datetime.utcnow()
    await log.save()
    
    return DailyLogResponse(
        id=str(log.id),
        member_id=log.member_id,
        log_date=log.log_date,
        calories_consumed=log.calories_consumed,
        calories_target=log.calories_target,
        protein=log.protein,
        protein_target=log.protein_target,
        carbs=log.carbs,
        carbs_target=log.carbs_target,
        fat=log.fat,
        fat_target=log.fat_target,
        water_glasses=log.water_glasses,
        water_target=log.water_target,
    )
