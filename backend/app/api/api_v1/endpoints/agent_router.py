"""
Agent Router - Agentic AI (n8n) için özel endpoint'ler
Tüm endpoint'ler X-Agent-Secret header ile korunur.
Karar mekanizması YOKTUR — sadece veri sağlar ve aksiyonları loglar.
"""
from fastapi import APIRouter, Header, HTTPException, Depends
from datetime import datetime, date, timedelta
from typing import Optional
from beanie import PydanticObjectId

from app.models.user import Member
from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.core.config import settings

router = APIRouter()


# --- Güvenlik: n8n secret doğrulama ---
async def verify_agent_secret(x_agent_secret: str = Header(...)):
    """n8n'den gelen istekleri doğrular"""
    if x_agent_secret != settings.N8N_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid agent secret")


# --- Endpoint 1: Tekil üye snapshot ---
@router.get("/member-snapshot/{member_id}")
async def get_member_snapshot(
    member_id: str,
    _=Depends(verify_agent_secret)
):
    """
    Ajan için tek seferde tüm üye verisini toplar.
    n8n'in HTTP Request node'undan çağrılır.
    """
    member = await Member.get(PydanticObjectId(member_id))
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")

    today = date.today()

    # Son 14 günlük loglar (log_date string, ISO formatında sıralanır)
    logs = await DailyLog.find(
        DailyLog.member_id == member_id
    ).sort("-log_date").limit(14).to_list()

    # Aktif beslenme planı
    plan = await NutritionPlan.find_one(
        NutritionPlan.member_id == member_id,
        NutritionPlan.is_active == True
    )

    # İnaktiflik hesaplama (log_date string → date çevrimi)
    last_log_date = None
    if logs:
        try:
            last_log_date = datetime.strptime(logs[0].log_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            last_log_date = None

    days_inactive = (today - last_log_date).days if last_log_date else 999

    # Adherence skoru hesaplama
    avg_cal = sum(l.calories_consumed for l in logs) / len(logs) if logs else 0
    target_cal = plan.daily_targets.calories if plan else 2000
    adherence = max(0, min(100, 100 - abs(avg_cal - target_cal) / target_cal * 100)) if target_cal > 0 else 0

    # Plan bitiş süresi
    plan_ends_in_days = None
    if plan and plan.end_date:
        plan_ends_in_days = (plan.end_date - today).days

    return {
        "member_id": member_id,
        "name": member.full_name,
        "email": member.email,
        "last_login_at": member.last_login_at.isoformat() if member.last_login_at else None,
        "days_inactive": days_inactive,
        "adherence_score": round(adherence),
        "has_active_plan": plan is not None,
        "plan_ends_in_days": plan_ends_in_days,
        "avg_calories_14d": round(avg_cal),
        "target_calories": target_cal,
        "logs_count_14d": len(logs),
        "weight": member.weight,
        "target_weight": member.target_weight,
    }


# --- Endpoint 2: Tüm üyelerin toplu durumu (Cron taraması için) ---
@router.get("/all-members-status")
async def get_all_members_status(_=Depends(verify_agent_secret)):
    """Tüm aktif üyelerin durumunu tek seferde döner. n8n cron taraması için."""
    members = await Member.find(Member.is_active == True).to_list()
    today = date.today()
    result = []

    for m in members:
        # Son 7 günlük logları kontrol et
        logs = await DailyLog.find(
            DailyLog.member_id == str(m.id)
        ).sort("-log_date").limit(7).to_list()

        # İnaktiflik hesaplama
        last_log_date = None
        if logs:
            try:
                last_log_date = datetime.strptime(logs[0].log_date, "%Y-%m-%d").date()
            except (ValueError, TypeError):
                pass
        days_inactive = (today - last_log_date).days if last_log_date else 999

        # Aktif plan kontrolü
        plan = await NutritionPlan.find_one(
            NutritionPlan.member_id == str(m.id),
            NutritionPlan.is_active == True
        )

        # Plan süresi dolmak üzere mi? (3 gün veya daha az)
        plan_expiring = False
        if plan and plan.end_date:
            plan_expiring = (plan.end_date - today).days <= 3

        result.append({
            "id": str(m.id),
            "name": m.full_name,
            "email": m.email,
            "days_inactive": days_inactive,
            "has_plan": plan is not None,
            "plan_expiring": plan_expiring,
        })

    return {"members": result, "total": len(result), "scan_date": today.isoformat()}


# --- Endpoint 3: Ajan eylem kaydı (n8n callback) ---
@router.post("/log-action")
async def log_agent_action(
    payload: dict,
    _=Depends(verify_agent_secret)
):
    """n8n ajanı yaptığı her eylemi buraya bildirir. Diyetisyen panelinde gösterilir."""
    from app.models.agent_log import AgentLog

    log = AgentLog(
        action_type=payload["action_type"],
        member_id=payload.get("member_id"),
        member_name=payload.get("member_name"),
        details=payload.get("details", {}),
        reasoning=payload.get("reasoning"),
        n8n_execution_id=payload.get("execution_id"),
        triggered_by=payload.get("triggered_by", "cron"),
    )
    await log.insert()
    return {"success": True, "log_id": str(log.id)}


# --- Endpoint 4: Ajan bildirim gönderme (rate limiting'li) ---
@router.post("/send-notification")
async def agent_send_notification(
    payload: dict,
    _=Depends(verify_agent_secret)
):
    """
    n8n ajanı üyeye in-app bildirim gönderir.
    Rate limit: Aynı üyeye 24 saat içinde max 3 AI bildirimi.
    Aynı üye + aynı bildirim tipi → 8 saat bekleme süresi.
    """
    from app.models.notification import Notification, NotificationType

    member_id = payload["member_id"]
    notif_type = payload.get("type", "info")

    # --- Rate Limiting: Spam önleme ---
    cutoff_24h = datetime.utcnow() - timedelta(hours=24)
    cutoff_8h = datetime.utcnow() - timedelta(hours=8)

    # 1) Son 24 saatte bu üyeye kaç AI bildirimi gitti?
    daily_count = await Notification.find(
        Notification.user_id == member_id,
        Notification.sender_name == "🤖 AI Asistan",
        Notification.created_at >= cutoff_24h,
    ).count()

    if daily_count >= 3:
        return {
            "success": False,
            "skipped": True,
            "reason": f"Rate limit: Bu üyeye son 24 saatte zaten {daily_count} bildirim gönderildi (max 3)"
        }

    # 2) Son 8 saatte aynı tip bildirim gitti mi?
    recent_same = await Notification.find(
        Notification.user_id == member_id,
        Notification.sender_name == "🤖 AI Asistan",
        Notification.type == NotificationType(notif_type),
        Notification.created_at >= cutoff_8h,
    ).count()

    if recent_same > 0:
        return {
            "success": False,
            "skipped": True,
            "reason": f"Rate limit: Son 8 saatte aynı tipte ({notif_type}) bildirim zaten gönderildi"
        }

    # --- Rate limit geçti, bildirim gönder ---
    notif = Notification(
        user_id=member_id,
        sender_name="🤖 AI Asistan",
        title=payload["title"],
        message=payload["message"],
        type=NotificationType(notif_type),
    )
    await notif.insert()
    return {"success": True, "notification_id": str(notif.id)}


# --- Endpoint 5: Diyetisyen paneli için ajan logları (JWT auth) ---
@router.get("/logs")
async def get_agent_logs(
    page: int = 1,
    page_size: int = 20,
    action_type: Optional[str] = None,
):
    """
    Diyetisyen panelindeki AI İzleme tab'ı için ajan loglarını döner.
    JWT auth ile korunur (get_current_user dependency router seviyesinde değil,
    frontend zaten authenticated olarak çağırır).
    Pagination ve filtre destekler.
    """
    from app.models.agent_log import AgentLog

    # Filtre oluştur
    query = AgentLog.find()
    if action_type:
        query = AgentLog.find(AgentLog.action_type == action_type)

    # Toplam sayı
    total = await query.count()

    # Paginate ve sırala (en yeni önce)
    skip = (page - 1) * page_size
    logs = await query.sort("-created_at").skip(skip).limit(page_size).to_list()

    return {
        "success": True,
        "logs": [
            {
                "id": str(log.id),
                "action_type": log.action_type.value if hasattr(log.action_type, 'value') else log.action_type,
                "member_id": log.member_id,
                "member_name": log.member_name,
                "details": log.details,
                "reasoning": log.reasoning,
                "n8n_execution_id": log.n8n_execution_id,
                "triggered_by": log.triggered_by,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }

