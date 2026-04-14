"""
AI Router - Diyetisyenler için AI analiz endpoint'leri
"""
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.models.user import User, Dietitian, Member, UserRole
from app.models.nutrition_plan import NutritionPlan
from app.models.daily_log import DailyLog
from app.models.agentic_report import AgenticReport, AgenticMemberStatus
from app.api.api_v1.endpoints.auth import get_current_user
from app.services.n8n_service import n8n_service
from app.core.config import settings

router = APIRouter()


async def get_dietitian_user(current_user: User = Depends(get_current_user)) -> Dietitian:
    """Diyetisyen kullanıcısını doğrular."""
    if current_user.role != UserRole.DIETITIAN:
        raise HTTPException(status_code=403, detail="Dietitian access required")
    return current_user


class AIAnalyzeRequest(BaseModel):
    member_id: str


class AIAnalyzeResponse(BaseModel):
    success: bool
    analysis: str = None
    error: str = None


@router.post("/analyze-member", response_model=AIAnalyzeResponse)
async def analyze_member_with_ai(
    request: AIAnalyzeRequest,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    Seçilen üyenin verilerini AI ile analiz et.
    
    Diyetisyen, danışanının tüm verilerini AI'a gönderip
    kişiselleştirilmiş diyet önerileri alır.
    """
    member_id = request.member_id
    
    # Üyeyi bul
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Sistemde tek diyetisyen olduğu için yetki kontrolüne gerek yok
    
    # Aktif beslenme planını al
    active_plan = await NutritionPlan.find_one(
        NutritionPlan.member_id == member_id,
        NutritionPlan.is_active == True
    )
    
    active_plan_data = None
    if active_plan:
        active_plan_data = {
            "title": active_plan.title,
            "daily_targets": {
                "calories": active_plan.daily_targets.calories,
                "protein": active_plan.daily_targets.protein,
                "carbs": active_plan.daily_targets.carbs,
                "fat": active_plan.daily_targets.fat,
                "water": active_plan.daily_targets.water,
            }
        }
    
    # Son 14 günlük logları al
    daily_logs = await DailyLog.find(
        DailyLog.member_id == member_id
    ).sort(-DailyLog.log_date).limit(14).to_list()
    
    logs_data = []
    for log in daily_logs:
        logs_data.append({
            "date": str(log.log_date),
            "calories_consumed": log.calories_consumed,
            "protein": log.protein,
            "carbs": log.carbs,
            "fat": log.fat,
        })
    
    # Üye verisini hazırla
    member_data = {
        "full_name": member.full_name,
        "email": member.email,
        "gender": member.gender.value if member.gender else None,
        "birth_date": str(member.birth_date) if member.birth_date else None,
        "weight": member.weight,
        "height": member.height,
        "target_weight": member.target_weight,
        "activity_level": member.activity_level.value if member.activity_level else None,
    }
    
    # n8n'e gönderilecek context'i hazırla
    context = n8n_service.prepare_member_context(
        member=member_data,
        active_plan=active_plan_data,
        daily_logs=logs_data
    )
    
    # n8n'e gönder ve yanıt al
    result = await n8n_service.analyze_member(context)
    
    if result["success"]:
        return AIAnalyzeResponse(
            success=True,
            analysis=result["analysis"]
        )
    else:
        return AIAnalyzeResponse(
            success=False,
            error=result.get("error", "Bilinmeyen hata")
        )


# ==================== YENİ AI ENDPOINTLERİ ====================

class WeeklyProgressRequest(BaseModel):
    member_id: str


class WeeklyProgressResponse(BaseModel):
    success: bool
    score: int = None
    score_label: str = None
    summary: str = None
    positives: list = None
    improvements: list = None
    recommendations: list = None
    trend: str = None
    alert: str = None
    error: str = None


@router.post("/weekly-progress", response_model=WeeklyProgressResponse)
async def get_weekly_progress(
    request: WeeklyProgressRequest,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    Agentic AI - Haftalık Gelişim Analizi
    
    Danışanın son 7 günlük verilerini n8n'e gönderip Gemini AI ile analiz eder.
    Manuel tetikleme veya otomatik Cron ile çalışabilir.
    """
    member_id = request.member_id
    
    # Üyeyi bul
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Sistemde tek diyetisyen olduğu için yetki kontrolüne gerek yok
    
    # Aktif planı al
    active_plan = await NutritionPlan.find_one(
        NutritionPlan.member_id == member_id,
        NutritionPlan.is_active == True
    )
    
    # Son 7 günlük logları al
    daily_logs = await DailyLog.find(
        DailyLog.member_id == member_id
    ).sort(-DailyLog.log_date).limit(7).to_list()
    
    if len(daily_logs) == 0:
        return WeeklyProgressResponse(
            success=False,
            error="Bu danışanın son 7 günde log verisi bulunmuyor"
        )
    
    # n8n'e gönderilecek veriyi hazırla
    logs_data = []
    for log in daily_logs:
        logs_data.append({
            "date": str(log.log_date),
            "calories": log.calories_consumed,
            "protein": log.protein,
            "carbs": log.carbs,
            "fat": log.fat,
            "water": log.water_glasses if hasattr(log, 'water_glasses') else 0
        })
    
    target_calories = active_plan.daily_targets.calories if active_plan else 2000
    target_protein = active_plan.daily_targets.protein if active_plan else 100
    
    # n8n'e gönderilecek payload
    n8n_payload = {
        "member_name": member.full_name or "Danışan",
        "target_calories": target_calories,
        "target_protein": target_protein,
        "target_weight": member.target_weight,
        "current_weight": member.weight,
        "weekly_logs": logs_data,
        "days_logged": len(daily_logs),
        "request_type": "weekly_progress"
    }
    
    # n8n'e gönder ve AI yanıtı al
    result = await n8n_service.weekly_progress(n8n_payload)
    
    if result["success"]:
        data = result.get("data", {})
        return WeeklyProgressResponse(
            success=True,
            score=data.get("score", 5),
            score_label=data.get("scoreLabel", data.get("score_label", "Orta")),
            summary=data.get("summary", "AI analizi tamamlandı."),
            positives=data.get("positives", []),
            improvements=data.get("improvements", []),
            recommendations=data.get("recommendations", []),
            trend=data.get("trend", "stable"),
            alert=data.get("alert")
        )
    else:
        return WeeklyProgressResponse(
            success=False,
            error=result.get("error", "n8n bağlantı hatası")
        )


class DailyReportResponse(BaseModel):
    success: bool
    date: str = None
    summary: dict = None
    members: list = None
    error: str = None


@router.post("/daily-report", response_model=DailyReportResponse)
async def get_daily_report(
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    Günlük Danışan Raporu
    
    Diyetisyenin tüm danışanlarının durumunu n8n'e gönderip
    Gemini AI ile öncelik sırasına göre aksiyon listesi oluşturur.
    """
    from datetime import datetime, timedelta, date
    
    # Sistemde tek diyetisyen olduğu için tüm danışanları al
    all_members = await Member.find_all().to_list()
    
    if not all_members:
        return DailyReportResponse(
            success=False,
            error="Henüz danışanınız bulunmuyor"
        )
    
    today = date.today()
    
    # n8n'e gönderilecek danışan verileri
    members_data = []
    
    for member in all_members:
        # Son 7 günlük logları al
        daily_logs = await DailyLog.find(
            DailyLog.member_id == str(member.id)
        ).sort(-DailyLog.log_date).limit(7).to_list()
        
        # Aktif planı al
        active_plan = await NutritionPlan.find_one(
            NutritionPlan.member_id == str(member.id),
            NutritionPlan.is_active == True
        )
        
        # Log verilerini hazırla
        logs_summary = []
        total_calories = 0
        last_log_date = None
        
        for log in daily_logs:
            logs_summary.append({
                "date": str(log.log_date),
                "calories": log.calories_consumed,
                "protein": log.protein,
                "carbs": log.carbs,
                "fat": log.fat
            })
            total_calories += log.calories_consumed
            if last_log_date is None:
                last_log_date = log.log_date
        
        # Hedefler ve hesaplamalar
        target_calories = active_plan.daily_targets.calories if active_plan else 2000
        avg_calories = total_calories / len(daily_logs) if daily_logs else 0
        calorie_compliance = max(0, min(100, 100 - abs(avg_calories - target_calories) / target_calories * 100)) if target_calories > 0 else 0
        
        # Son log'dan bu yana geçen gün
        days_since_last_log = 0
        if last_log_date:
            days_since_last_log = (today - last_log_date).days
        else:
            days_since_last_log = 999  # Hiç log yok
        
        # Program bitiş tarihi kontrolü
        program_end_date = None
        days_until_program_ends = None
        if active_plan and active_plan.end_date:
            program_end_date = str(active_plan.end_date)
            days_until_program_ends = (active_plan.end_date - today).days
        
        member_data = {
            "id": str(member.id),
            "name": member.full_name or "İsimsiz",
            "email": member.email,
            
            # Kilo bilgileri
            "current_weight": member.weight,
            "target_weight": member.target_weight,
            "weight_diff": member.weight - member.target_weight if member.weight and member.target_weight else None,
            
            # Plan bilgileri
            "has_active_plan": active_plan is not None,
            "plan_title": active_plan.title if active_plan else None,
            "target_calories": target_calories,
            "program_end_date": program_end_date,
            "days_until_program_ends": days_until_program_ends,
            
            # Log bilgileri
            "days_logged": len(daily_logs),
            "days_since_last_log": days_since_last_log,
            "last_log_date": str(last_log_date) if last_log_date else None,
            
            # Performans metrikleri
            "avg_calories": round(avg_calories),
            "calorie_compliance": round(calorie_compliance),
            
            # Ham log verileri
            "weekly_logs": logs_summary
        }
        members_data.append(member_data)
    
    # n8n'e gönderilecek payload
    n8n_payload = {
        "dietitian_name": current_user.full_name,
        "report_date": datetime.now().strftime("%Y-%m-%d"),
        "total_members": len(all_members),
        "members": members_data,
        "request_type": "daily_report"
    }
    
    # n8n'e gönder ve AI yanıtı al
    result = await n8n_service.daily_report(n8n_payload)
    
    if result["success"]:
        data = result.get("data", {})
        
        # AI yanıtı string olarak gelebilir (JSON markdown code block içinde)
        if isinstance(data, str):
            import json
            import re
            # ```json\n...\n``` formatını temizle
            cleaned = data.strip()
            if cleaned.startswith("```"):
                # Markdown code block'u temizle
                cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
                cleaned = re.sub(r'\n?```\s*$', '', cleaned)
            try:
                data = json.loads(cleaned)
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Raw data: {cleaned[:500]}")
                data = {}
        
        # AI yanıtından gelen verileri parse et
        members_list = data.get("members", [])
        summary_data = data.get("summary", {
            "total": len(all_members),
            "critical": len([m for m in members_list if m.get("status") == "critical"]),
            "warning": len([m for m in members_list if m.get("status") == "warning"]),
            "good": len([m for m in members_list if m.get("status") == "good"])
        })
        
        return DailyReportResponse(
            success=True,
            date=data.get("report_date", data.get("date", datetime.now().strftime("%Y-%m-%d"))),
            summary=summary_data,
            members=members_list
        )
    else:
        return DailyReportResponse(
            success=False,
            error=result.get("error", "n8n bağlantı hatası")
        )


# ==================== AI BESLENME PROGRAMI OLUŞTURUCU ====================

class GeneratePlanRequest(BaseModel):
    member_id: str
    goal: str  # weight_loss, muscle_gain, maintenance
    target_calories: int
    menu_type: str = "daily"  # daily veya weekly
    medications: str = None
    allergies: str = None
    disliked_foods: str = None


class GeneratePlanResponse(BaseModel):
    success: bool
    daily_targets: dict = None
    meals: list = None
    error: str = None


@router.post("/generate-plan", response_model=GeneratePlanResponse)
async def generate_plan_with_ai(
    request: GeneratePlanRequest,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    AI ile Beslenme Programı Oluştur
    
    Hedef ve kalori bilgilerine göre AI beslenme programı önerir.
    Diyetisyen bu öneriyi düzenleyip kaydedebilir.
    """
    member_id = request.member_id
    
    # Üyeyi bul
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Üye bulunamadı")
    
    # Sistemde tek diyetisyen olduğu için yetki kontrolüne gerek yok
    
    # Hedef etiketlerini Türkçeleştir
    goal_labels = {
        "weight_loss": "Kilo Verme",
        "muscle_gain": "Kas Kazanımı",
        "maintenance": "Kilo Koruma"
    }
    
    # Menü tipi etiketi
    menu_type_label = "haftalık (7 günlük)" if request.menu_type == "weekly" else "günlük"

    # n8n'e gönderilecek payload
    n8n_payload = {
        "goal": request.goal,
        "goal_label": goal_labels.get(request.goal, request.goal),
        "target_calories": request.target_calories,
        "member_name": member.full_name or "Danışan",
        "current_weight": member.weight,
        "target_weight": member.target_weight,
        "height": member.height,
        "gender": member.gender.value if member.gender else None,
        "activity_level": member.activity_level.value if member.activity_level else "moderate",
        "menu_type": request.menu_type or "daily",
        "menu_type_label": menu_type_label,
        "medications": request.medications or None,
        "allergies": request.allergies or None,
        "disliked_foods": request.disliked_foods or None,
    }
    
    # n8n'e gönder ve AI yanıtı al
    result = await n8n_service.generate_nutrition_plan(n8n_payload)
    
    if result["success"]:
        data = result.get("data", {})
        return GeneratePlanResponse(
            success=True,
            daily_targets=data.get("daily_targets"),
            meals=data.get("meals", [])
        )
    else:
        return GeneratePlanResponse(
            success=False,
            error=result.get("error", "n8n bağlantı hatası")
        )

    # (n8n başarısız ise zaten buraya ulaşılmaz; hata durumunu aşağıda yakala)





# ==================== AGENTIC AI - ZAMANLANMIŞ GÖREVLER ====================

class AgenticReportRequest(BaseModel):
    dietitian_id: str = None  # Opsiyonel, boş ise tüm diyetisyenler


class AgenticMemberData(BaseModel):
    id: str
    name: str
    email: str
    status: str = "good"  # Default
    problem: str = None
    days_since_last_log: int
    program_status: str
    calorie_compliance: int
    recommendation: str = None


class AgenticReportResponse(BaseModel):
    success: bool
    dietitian_name: str = None
    report_date: str = None
    total_members: int = 0
    critical_count: int = 0
    warning_count: int = 0
    good_count: int = 0
    members: list = []
    error: str = None


@router.post("/agentic-report")
async def get_agentic_report(
    request: AgenticReportRequest = None
) -> Any:
    """
    Agentic AI için Danışan Raporu
    
    n8n Schedule Trigger tarafından çağrılır.
    Tüm danışanların durumunu analiz edip kritik/uyarı/iyi olarak sınıflandırır.
    """
    from datetime import datetime, date
    
    # Tüm diyetisyenleri al (şimdilik ilk aktif diyetisyen)
    dietitian = await Dietitian.find_one(Dietitian.is_active == True)
    if not dietitian:
        return AgenticReportResponse(
            success=False,
            error="Aktif diyetisyen bulunamadı"
        )
    
    # Sistemde tek diyetisyen olduğu için tüm danışanları al
    all_members = await Member.find_all().to_list()
    
    if not all_members:
        return AgenticReportResponse(
            success=True,
            dietitian_name=dietitian.full_name,
            report_date=datetime.now().strftime("%Y-%m-%d"),
            total_members=0,
            members=[]
        )
    
    today = date.today()
    members_data = []
    critical_count = 0
    warning_count = 0
    good_count = 0
    
    for member in all_members:
        # Son logları al
        daily_logs = await DailyLog.find(
            DailyLog.member_id == str(member.id)
        ).sort(-DailyLog.log_date).limit(7).to_list()
        
        # Aktif planı al
        active_plan = await NutritionPlan.find_one(
            NutritionPlan.member_id == str(member.id),
            NutritionPlan.is_active == True
        )
        
        # Hesaplamalar
        last_log_date = daily_logs[0].log_date if daily_logs else None
        days_since_last_log = (today - last_log_date).days if last_log_date else 999
        
        # Kalori uyumu
        total_calories = sum(log.calories_consumed for log in daily_logs)
        avg_calories = total_calories / len(daily_logs) if daily_logs else 0
        target_calories = active_plan.daily_targets.calories if active_plan else 2000
        calorie_compliance = max(0, min(100, 100 - abs(avg_calories - target_calories) / target_calories * 100)) if target_calories > 0 else 0
        
        # Program durumu
        program_status = "Aktif" if active_plan else "Program Yok"
        if active_plan and active_plan.end_date:
            days_until_end = (active_plan.end_date - today).days
            if days_until_end <= 0:
                program_status = "Bitti"
            elif days_until_end <= 3:
                program_status = f"{days_until_end} gün kaldı"
        
        members_data.append({
            "id": str(member.id),
            "name": member.full_name or "İsimsiz",
            "email": member.email,
            "days_since_last_log": days_since_last_log if days_since_last_log < 999 else None,
            "program_status": program_status,
            "calorie_compliance": int(calorie_compliance)
        })

    
    return AgenticReportResponse(
        success=True,
        dietitian_name=dietitian.full_name,
        report_date=datetime.now().strftime("%Y-%m-%d"),
        total_members=len(all_members),
        critical_count=0,
        warning_count=0,
        good_count=0,
        members=members_data
    )


@router.post("/agentic-alert")
async def send_agentic_alert(
    member_id: str,
    alert_type: str = "critical"
) -> Any:
    """
    Belirli bir danışan için n8n'e kritik uyarı gönder
    
    n8n webhook'u tetikler, Telegram'a mesaj gider.
    """
    import httpx
    
    member = await Member.get(member_id)
    if not member:
        return {"success": False, "error": "Danışan bulunamadı"}
    
    # n8n webhook'a gönder
    webhook_url = f"{settings.N8N_BASE_URL.rstrip('/')}/webhook/agentic-critical-alert"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook_url,
                json={
                    "member_id": str(member.id),
                    "member_name": member.full_name or "İsimsiz",
                    "email": member.email,
                    "status": alert_type,
                    "problem": "Acil durum tespit edildi",
                    "recommendation": "Danışanla iletişime geçin"
                }
            )
            
            return {
                "success": response.status_code == 200,
                "message": "Alert gönderildi" if response.status_code == 200 else "Gönderim başarısız"
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ==================== DİYETİSYEN İÇİN AGENTİC AI ENDPOİNTLERİ ====================

@router.get("/agentic-reports")
async def get_agentic_reports(
    current_user: Dietitian = Depends(get_dietitian_user),
    limit: int = 10
) -> Any:
    """
    Diyetisyenin geçmiş Agentic AI raporlarını getir
    """
    reports = await AgenticReport.find(
        AgenticReport.dietitian_id == str(current_user.id)
    ).sort(-AgenticReport.created_at).limit(limit).to_list()
    
    return {
        "success": True,
        "reports": [
            {
                "id": str(r.id),
                "report_date": r.report_date.isoformat(),
                "total_members": r.total_members,
                "critical_count": r.critical_count,
                "warning_count": r.warning_count,
                "good_count": r.good_count,
                "members": [m.dict() for m in r.members],
                "ai_message": r.ai_message,
                "created_at": r.created_at.isoformat()
            }
            for r in reports
        ]
    }


@router.get("/agentic-latest")
async def get_latest_agentic_report(
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    Diyetisyenin en son Agentic AI raporunu getir
    """
    report = await AgenticReport.find_one(
        AgenticReport.dietitian_id == str(current_user.id),
        sort=[("-created_at", -1)]
    )
    
    if not report:
        return {"success": False, "error": "Henüz rapor oluşturulmamış"}
    
    return {
        "success": True,
        "report": {
            "id": str(report.id),
            "report_date": report.report_date.isoformat(),
            "total_members": report.total_members,
            "critical_count": report.critical_count,
            "warning_count": report.warning_count,
            "good_count": report.good_count,
            "members": [m.dict() for m in report.members],
            "ai_message": report.ai_message,
            "created_at": report.created_at.isoformat()
        }
    }


@router.post("/agentic-generate")
async def generate_agentic_report(
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    n8n webhook'unu tetikleyerek Agentic AI raporu oluştur ve kaydet
    
    Flow:
    1. Backend → n8n webhook
    2. n8n → HTTP Request (backend /agentic-report) → LLM → Telegram
    3. n8n → Backend'e cevap döner
    4. Backend → Database'e kaydet
    5. Backend → Frontend'e döndür
    """
    from datetime import datetime
    
    # n8n webhook'unu tetikle
    n8n_result = await n8n_service.trigger_agentic_webhook({
        "dietitian_id": str(current_user.id),
        "dietitian_name": current_user.full_name,
        "trigger": "manual"
    })
    
    if not n8n_result["success"]:
        return {"success": False, "error": n8n_result.get("error", "n8n bağlantı hatası")}
    
    data = n8n_result.get("data", {})
    
    # n8n'den gelen veriyi parse et
    members_list = data.get("members", [])
    
    # AgenticMemberStatus objelerine çevir
    members_data = []
    for m in members_list:
        members_data.append(AgenticMemberStatus(
            id=m.get("id", ""),
            name=m.get("name", "İsimsiz"),
            email=m.get("email", ""),
            status=m.get("status", "good"),
            problem=m.get("problem"),
            days_since_last_log=m.get("days_since_last_log"),
            program_status=m.get("program_status", "Bilinmiyor"),
            calorie_compliance=m.get("calorie_compliance", 0),
            recommendation=m.get("recommendation")
        ))
    
    # AI mesajını al (varsa)
    ai_message = data.get("ai_message") or data.get("text") or data.get("message")
    
    # Raporu kaydet
    report = AgenticReport(
        dietitian_id=str(current_user.id),
        dietitian_name=current_user.full_name,
        report_date=datetime.now(),
        total_members=data.get("total_members", len(members_list)),
        critical_count=data.get("critical_count", 0),
        warning_count=data.get("warning_count", 0),
        good_count=data.get("good_count", 0),
        members=members_data,
        ai_message=ai_message
    )
    await report.insert()
    
    return {
        "success": True,
        "report": {
            "id": str(report.id),
            "report_date": report.report_date.isoformat(),
            "total_members": report.total_members,
            "critical_count": report.critical_count,
            "warning_count": report.warning_count,
            "good_count": report.good_count,
            "members": [m.dict() for m in report.members],
            "ai_message": report.ai_message,
            "created_at": report.created_at.isoformat()
        }
    }

