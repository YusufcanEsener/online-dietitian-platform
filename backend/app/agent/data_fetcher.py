import asyncio
from typing import Optional

from beanie import PydanticObjectId

from app.agent.schemas import MemberAnalysisContext
from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.models.user import Member


async def fetch_member_data(member_id: str, log_limit: int = 14) -> Optional[MemberAnalysisContext]:
    """Uye, son loglar ve en guncel plani tek akista toplar."""
    try:
        member_object_id = PydanticObjectId(member_id)
    except Exception:
        return None

    member_task = Member.get(member_object_id)
    logs_task = DailyLog.find(
        DailyLog.member_id == member_id
    ).sort("-log_date").limit(log_limit).to_list()
    active_plan_task = NutritionPlan.find(
        NutritionPlan.member_id == member_id,
        NutritionPlan.is_active == True,  # noqa: E712
    ).sort("-created_at").limit(1).to_list()

    member, daily_logs, active_plans = await asyncio.gather(
        member_task, logs_task, active_plan_task,
    )

    if member is None:
        return None

    # Aktif plan varsa onu kullan, yoksa en son oluşturulan planı fallback getir
    plan = active_plans[0] if active_plans else None
    if plan is None:
        fallback_plans = await NutritionPlan.find(
            NutritionPlan.member_id == member_id,
        ).sort("-created_at").limit(1).to_list()
        plan = fallback_plans[0] if fallback_plans else None

    return MemberAnalysisContext(
        member=member,
        daily_logs=daily_logs,
        plan=plan,
    )
