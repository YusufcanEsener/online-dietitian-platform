from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User, Member
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.schemas.subscription import PlanCreate, PlanResponse, SubscriptionResponse
from app.api.api_v1.endpoints.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/plans", response_model=PlanResponse)
async def create_plan(
    plan_in: PlanCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Yeni abonelik planı oluşturur (Admin)."""
    # TODO: Admin kontrolü eklenebilir
    plan = SubscriptionPlan(**plan_in.dict())
    await plan.create()
    return PlanResponse(**plan.dict(), id=str(plan.id))

@router.get("/plans", response_model=List[PlanResponse])
async def list_plans() -> Any:
    """Mevcut abonelik planlarını listeler."""
    plans = await SubscriptionPlan.find_all().to_list()
    return [PlanResponse(**p.dict(), id=str(p.id)) for p in plans]

@router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: str) -> Any:
    """Belirli bir abonelik planını döndürür."""
    plan = await SubscriptionPlan.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return PlanResponse(**plan.dict(), id=str(plan.id))

@router.get("/my-subscription", response_model=SubscriptionResponse)
async def get_my_subscription(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Kullanıcının aktif aboneliğini döndürür."""
    sub = await UserSubscription.find_one(
        UserSubscription.user_id == str(current_user.id),
        UserSubscription.is_active == True
    )
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")
    
    return SubscriptionResponse(
        id=str(sub.id),
        plan_id=sub.plan_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        is_active=sub.is_active
    )

@router.post("/purchase", response_model=SubscriptionResponse)
async def purchase_subscription(
    plan_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Abonelik satın alır (simülasyon)."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Only members can subscribe")
    
    plan = await SubscriptionPlan.get(plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Mevcut aktif aboneliği iptal et
    existing_sub = await UserSubscription.find_one(
        UserSubscription.user_id == str(current_user.id),
        UserSubscription.is_active == True
    )
    if existing_sub:
        existing_sub.is_active = False
        await existing_sub.save()
    
    # Yeni abonelik oluştur
    start_date = datetime.utcnow()
    end_date = start_date + timedelta(days=plan.duration_days)
    
    sub = UserSubscription(
        user_id=str(current_user.id),
        plan_id=plan_id,
        start_date=start_date,
        end_date=end_date,
        is_active=True
    )
    await sub.create()
    
    # Üyenin subscription durumunu güncelle
    member = await Member.get(current_user.id)
    member.subscription_status = True
    await member.save()
    
    return SubscriptionResponse(
        id=str(sub.id),
        plan_id=sub.plan_id,
        start_date=sub.start_date,
        end_date=sub.end_date,
        is_active=sub.is_active
    )

@router.delete("/my-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Aktif aboneliği iptal eder."""
    if not isinstance(current_user, Member):
        raise HTTPException(status_code=400, detail="Only members can have subscriptions")
    
    sub = await UserSubscription.find_one(
        UserSubscription.user_id == str(current_user.id),
        UserSubscription.is_active == True
    )
    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")
    
    sub.is_active = False
    await sub.save()
    
    member = await Member.get(current_user.id)
    member.subscription_status = False
    await member.save()
    
    return {"message": "Subscription cancelled"}

