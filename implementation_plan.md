# 🤖 Agentic AI Katmanı — Teknik Yol Haritası

## Mevcut Durum Özeti

Projeniz zaten güçlü bir temel altyapıya sahip:

| Bileşen | Durum |
|---------|-------|
| FastAPI Backend (Beanie/Motor) | ✅ Aktif |
| MongoDB Koleksiyonları | `users`, `members`, `dietitians`, `daily_logs`, `nutrition_plans`, `notifications`, `agentic_reports`, `chats`, `messages` |
| n8n Entegrasyonu | ✅ Docker'da mevcut, 4 webhook aktif |
| Mevcut AI Akışları | `ai-analyze`, `ai-weekly-progress`, `ai-daily-report`, `ai-generate-plan`, `agentic-manual-trigger` |
| N8NService | ✅ Singleton, 5 metod |

> [!IMPORTANT]
> Mevcut yapı **reaktif** (diyetisyen tetikliyor). Hedef: **proaktif** otonom ajan katmanı eklemek.

---

## 1. Backend Analizi — Yeni "Agent-Only" API Uç Noktaları

### Mevcut Eksiklikler

| Eksik Veri | Neden Gerekli |
|------------|---------------|
| `last_login_at` (Member modelde yok) | Ajan pasif kullanıcıları tespit edemez |
| Üye adherence skoru | Program uyumu hesaplanamaz |
| Agent task durumu | Ajanın ne yaptığı izlenemez |
| Webhook callback | n8n → Backend geri bildirim yok |

### Yeni Endpoint'ler

#### A) `POST /api/v1/agent/member-snapshot/{member_id}` — Ajan Veri Toplama

n8n'in HTTP Request node'undan çağrılır. Tek seferde üyenin tüm context'ini döner.

```python
# backend/app/api/api_v1/endpoints/agent_router.py

from fastapi import APIRouter, Header, HTTPException
from datetime import datetime, date, timedelta
from app.models.user import Member, Dietitian
from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.core.config import settings

router = APIRouter()

async def verify_agent_secret(x_agent_secret: str = Header(...)):
    """n8n'den gelen istekleri doğrular"""
    if x_agent_secret != settings.N8N_AGENT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid agent secret")

@router.get("/member-snapshot/{member_id}")
async def get_member_snapshot(
    member_id: str,
    _=Depends(verify_agent_secret)
):
    """Ajan için tek seferde tüm üye verisini toplar"""
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404)
    
    today = date.today()
    
    # Son 14 günlük loglar
    logs = await DailyLog.find(
        DailyLog.member_id == member_id
    ).sort(-DailyLog.log_date).limit(14).to_list()
    
    # Aktif plan
    plan = await NutritionPlan.find_one(
        NutritionPlan.member_id == member_id,
        NutritionPlan.is_active == True
    )
    
    # Hesaplamalar
    last_log_date = logs[0].log_date if logs else None
    days_inactive = (today - last_log_date).days if last_log_date else 999
    
    avg_cal = sum(l.calories_consumed for l in logs) / len(logs) if logs else 0
    target_cal = plan.daily_targets.calories if plan else 2000
    adherence = max(0, min(100, 100 - abs(avg_cal - target_cal) / target_cal * 100))
    
    return {
        "member_id": member_id,
        "name": member.full_name,
        "email": member.email,
        "last_login_at": getattr(member, 'last_login_at', None),
        "days_inactive": days_inactive,
        "adherence_score": round(adherence),
        "has_active_plan": plan is not None,
        "plan_ends_in_days": (plan.end_date - today).days if plan and plan.end_date else None,
        "avg_calories_14d": round(avg_cal),
        "target_calories": target_cal,
        "logs_count_14d": len(logs),
        "weight": member.weight,
        "target_weight": member.target_weight,
    }
```

#### B) `POST /api/v1/agent/log-action` — Ajan Eylem Kaydı (Callback)

```python
@router.post("/log-action")
async def log_agent_action(
    payload: dict,
    _=Depends(verify_agent_secret)
):
    """n8n ajanı yaptığı her eylemi buraya bildirir"""
    from app.models.agent_log import AgentLog
    
    log = AgentLog(
        action_type=payload["action_type"],   # "notification_sent", "plan_alert", "escalation"
        member_id=payload.get("member_id"),
        details=payload.get("details", {}),
        reasoning=payload.get("reasoning"),     # Ajanın muhakeme metni
        n8n_execution_id=payload.get("execution_id"),
        triggered_by=payload.get("triggered_by", "cron"),  # "cron" | "webhook" | "manual"
    )
    await log.insert()
    return {"success": True, "log_id": str(log.id)}
```

#### C) `GET /api/v1/agent/all-members-status` — Toplu Durum

```python
@router.get("/all-members-status")
async def get_all_members_status(_=Depends(verify_agent_secret)):
    """Tüm üyelerin durumunu tek seferde döner (Cron taraması için)"""
    members = await Member.find(Member.is_active == True).to_list()
    today = date.today()
    result = []
    
    for m in members:
        logs = await DailyLog.find(
            DailyLog.member_id == str(m.id)
        ).sort(-DailyLog.log_date).limit(7).to_list()
        
        last_log = logs[0].log_date if logs else None
        days_inactive = (today - last_log).days if last_log else 999
        
        plan = await NutritionPlan.find_one(
            NutritionPlan.member_id == str(m.id),
            NutritionPlan.is_active == True
        )
        
        result.append({
            "id": str(m.id),
            "name": m.full_name,
            "email": m.email,
            "days_inactive": days_inactive,
            "has_plan": plan is not None,
            "plan_expiring": plan and plan.end_date and (plan.end_date - today).days <= 3,
        })
    
    return {"members": result, "total": len(result), "scan_date": today.isoformat()}
```

#### D) `POST /api/v1/agent/send-notification` — Ajan Bildirim Gönderme

```python
@router.post("/send-notification")
async def agent_send_notification(
    payload: dict,
    _=Depends(verify_agent_secret)
):
    """n8n ajanı üyeye in-app bildirim gönderir"""
    from app.models.notification import Notification, NotificationType
    
    notif = Notification(
        user_id=payload["member_id"],
        sender_name="🤖 AI Asistan",
        title=payload["title"],
        message=payload["message"],
        type=NotificationType(payload.get("type", "info")),
    )
    await notif.insert()
    return {"success": True, "notification_id": str(notif.id)}
```

---

## 2. Veritabanı Şeması — Yeni Koleksiyonlar

### A) `agent_logs` Koleksiyonu (Ajan Eylem Takibi)

```python
# backend/app/models/agent_log.py

from typing import Optional, Dict, Any
from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum

class AgentActionType(str, Enum):
    NOTIFICATION_SENT = "notification_sent"
    PLAN_EXPIRY_ALERT = "plan_expiry_alert"
    INACTIVITY_WARNING = "inactivity_warning"
    ADHERENCE_CHECK = "adherence_check"
    ESCALATION_TO_DIETITIAN = "escalation_to_dietitian"
    PLAN_SUGGESTION = "plan_suggestion"
    WHATSAPP_SENT = "whatsapp_sent"
    WEEKLY_REPORT = "weekly_report"

class AgentLog(Document):
    """Ajanın her otonom eyleminin kaydı"""
    action_type: AgentActionType
    member_id: Optional[str] = None
    details: Dict[str, Any] = {}
    reasoning: Optional[str] = None         # AI'ın neden bu kararı verdiği
    n8n_execution_id: Optional[str] = None
    triggered_by: str = "cron"              # cron | webhook | manual
    status: str = "completed"               # completed | failed | pending
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agent_logs"
```

### B) `task_queue` Koleksiyonu (Asenkron Görev Kuyruğu)

```python
# backend/app/models/task_queue.py

from typing import Optional, Dict, Any
from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AgentTask(Document):
    """Ajanın işleyeceği görev kuyruğu"""
    task_type: str               # "check_adherence", "send_reminder", "generate_report"
    priority: TaskPriority = TaskPriority.MEDIUM
    member_id: Optional[str] = None
    payload: Dict[str, Any] = {}
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    retry_count: int = 0
    max_retries: int = 3
    scheduled_at: Optional[datetime] = None  # Zamanlı görevler için
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "task_queue"
```

### C) `Member` Modeline Eklenecek Alanlar

```python
# user.py Member modeline eklenmesi gereken alanlar:
last_login_at: Optional[datetime] = None
agent_preferences: Optional[dict] = None  # {"notification_hour": 14, "whatsapp_enabled": true}
```

### MongoDB İndeksleri

```javascript
// agent_logs için
db.agent_logs.createIndex({ "member_id": 1, "created_at": -1 })
db.agent_logs.createIndex({ "action_type": 1, "created_at": -1 })

// task_queue için
db.task_queue.createIndex({ "status": 1, "priority": -1, "scheduled_at": 1 })
db.task_queue.createIndex({ "member_id": 1, "status": 1 })
```

---

## 3. n8n Entegrasyon Stratejisi

### Webhook Haritası (FastAPI → n8n)

| Tetikleyici | Webhook URL | Açıklama |
|-------------|-------------|----------|
| Cron (her 2 saatte) | `Schedule Trigger` | Tüm üyeleri tarar, inaktif olanları tespit eder |
| Cron (günlük 09:00) | `Schedule Trigger` | Günlük diyetisyen raporu |
| Cron (haftalık Pzt) | `Schedule Trigger` | Haftalık ilerleme analizi |
| Üye log girmezse | `POST /webhook/agent-inactivity` | Backend event hook tetikler |
| Program bitişine 3 gün | `POST /webhook/agent-plan-expiry` | Cron taramasından gelir |

### n8n "AI Agent" Node Tool Tanımları

n8n'deki AI Agent node'u şu tool'ları kullanır:

```
Tool 1: check_user_adherence
  → HTTP Request → GET /api/v1/agent/member-snapshot/{member_id}
  → Dönen adherence_score'a göre karar verir

Tool 2: send_in_app_notification  
  → HTTP Request → POST /api/v1/agent/send-notification
  → {member_id, title, message, type}

Tool 3: log_agent_action
  → HTTP Request → POST /api/v1/agent/log-action
  → Her eylemden sonra kayıt tutar

Tool 4: get_all_members_status
  → HTTP Request → GET /api/v1/agent/all-members-status
  → Toplu tarama için

Tool 5: send_whatsapp_notification (Faz 3)
  → Twilio / WhatsApp Business API node
  → Kritik durumlarda WhatsApp mesajı
```

### Örnek n8n Workflow JSON Şeması (Cron → Agent Döngüsü)

```json
{
  "name": "Agentic AI - Proactive Member Monitor",
  "nodes": [
    {
      "type": "n8n-nodes-base.scheduleTrigger",
      "name": "Her 2 Saatte Çalış",
      "parameters": {
        "rule": { "interval": [{ "field": "hours", "hoursInterval": 2 }] }
      },
      "position": [250, 300]
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "name": "Tüm Üye Durumlarını Al",
      "parameters": {
        "method": "GET",
        "url": "http://backend:8000/api/v1/agent/all-members-status",
        "headerParametersJson": "{\"X-Agent-Secret\": \"{{$env.N8N_AGENT_SECRET}}\"}"
      },
      "position": [470, 300]
    },
    {
      "type": "n8n-nodes-base.if",
      "name": "Kritik Üye Var Mı?",
      "parameters": {
        "conditions": {
          "number": [{ "value1": "={{$json.members.filter(m => m.days_inactive > 3).length}}", "operation": "larger", "value2": 0 }]
        }
      },
      "position": [690, 300]
    },
    {
      "type": "@n8n/n8n-nodes-langchain.agent",
      "name": "AI Agent - Karar Verici",
      "parameters": {
        "text": "Aşağıdaki üyeleri analiz et ve her biri için eylem planı oluştur:\n{{JSON.stringify($json.members.filter(m => m.days_inactive > 3))}}\n\nKurallar:\n1. 3+ gün inaktif → bildirim gönder\n2. 7+ gün inaktif → diyetisyene eskalasyon\n3. Plan süresi doluyorsa → hatırlatma\n\nHer üye için reasoning (neden) yaz ve uygun tool'u çağır.",
        "options": { "systemMessage": "Sen bir diyetisyen asistanısın. Danışanların sağlığını proaktif takip edersin." }
      },
      "position": [910, 200]
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "name": "Eylemi Logla",
      "parameters": {
        "method": "POST",
        "url": "http://backend:8000/api/v1/agent/log-action",
        "headerParametersJson": "{\"X-Agent-Secret\": \"{{$env.N8N_AGENT_SECRET}}\"}",
        "bodyParametersJson": "={{JSON.stringify($json)}}"
      },
      "position": [1130, 300]
    }
  ]
}
```

---

## 4. Agentic Mantık Tasarımı

### Reasoning Döngüsü: **ReAct (Reason + Act)**

```
┌──────────────────────────────────────────────┐
│          SCHEDULE TRIGGER (Cron)             │
│         Her 2 saatte bir tetiklenir          │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│    OBSERVE: Tüm üye durumlarını topla        │
│    GET /agent/all-members-status             │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│    REASON: AI Agent her üyeyi değerlendirir  │
│    - days_inactive > 3? → Uyarı              │
│    - days_inactive > 7? → Eskalasyon         │
│    - plan_expiring? → Hatırlatma             │
│    - adherence < 50%? → Motivasyon mesajı    │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│    ACT: Karar verilen eylemi uygula          │
│    - send_in_app_notification()              │
│    - escalate_to_dietitian()                 │
│    - send_whatsapp() (Faz 3)                 │
└──────────────────┬───────────────────────────┘
                   ▼
┌──────────────────────────────────────────────┐
│    LOG: Her eylemi agent_logs'a kaydet       │
│    POST /agent/log-action                    │
└──────────────────────────────────────────────┘
```

### Cron Job Eşleştirme Tablosu

| Zamanlama | n8n Node | İş |
|-----------|----------|----|
| `0 */2 * * *` (2 saatte bir) | Schedule Trigger | İnaktiflik taraması |
| `0 9 * * *` (günlük 09:00) | Schedule Trigger | Günlük diyetisyen raporu |
| `0 10 * * 1` (Pzt 10:00) | Schedule Trigger | Haftalık ilerleme analizi |
| `0 14 * * *` (günlük 14:00) | Schedule Trigger | Öğle hatırlatması |
| `0 20 * * *` (günlük 20:00) | Schedule Trigger | Akşam günlük özeti |

---

## 5. Uygulama Planı (3 Faz)

### Faz 1 — Temel Altyapı (1-2 Hafta)

- [ ] `Member` modeline `last_login_at` alanı ekle
- [ ] `AgentLog` ve `AgentTask` modellerini oluştur
- [ ] `database.py`'ye yeni modelleri kaydet
- [ ] `agent_router.py` oluştur (4 endpoint)
- [ ] `config.py`'ye `N8N_AGENT_SECRET` ekle
- [ ] `router.py`'ye agent router'ı bağla
- [ ] Login endpoint'inde `last_login_at` güncelle
- [ ] Birim testleri yaz

### Faz 2 — n8n Ajan Workflow'ları (2-3 Hafta)

- [ ] n8n'de "Proactive Monitor" workflow oluştur
- [ ] Schedule Trigger → HTTP → AI Agent → Tool chain
- [ ] AI Agent node'a tool'ları tanımla
- [ ] Günlük rapor cron'u aktifleştir
- [ ] İnaktiflik tarama cron'u kur
- [ ] Telegram/e-posta bildirim entegrasyonu
- [ ] Diyetisyen dashboard'a agent log paneli ekle (frontend)

### Faz 3 — Gelişmiş Özellikler (3-4 Hafta)

- [ ] WhatsApp Business API entegrasyonu
- [ ] Plan otomatik yenileme önerisi
- [ ] Üye tercih yönetimi (bildirim saatleri)
- [ ] Agent performans dashboard'u
- [ ] A/B test: Hangi mesaj tonu daha etkili
- [ ] Rate limiting (üyeye günde max 3 bildirim)

---

## Doğrulama Planı

### Otomatik Testler
```bash
# Agent endpoint'lerini test et
pytest backend/tests/test_agent_router.py -v

# n8n webhook bağlantısını test et  
curl -X GET http://localhost:8000/api/v1/agent/all-members-status \
  -H "X-Agent-Secret: test-secret"
```

### Manuel Doğrulama
- n8n workflow'unu manual execute ile test et
- `agent_logs` koleksiyonunda kayıtları kontrol et
- Bildirimlerin üye panelinde göründüğünü doğrula

---

## Açık Sorular

> [!IMPORTANT]
> 1. **WhatsApp entegrasyonu** için Twilio mu yoksa Meta Business API mi tercih ediyorsunuz?
> 2. **Bildirim sıklık limiti**: Üyeye günde kaç bildirim kabul edilebilir? (Önerim: max 3)
> 3. **Eskalasyon eşiği**: Kaç gün inaktiflik sonrası diyetisyene bildirim gitsin? (Önerim: 7 gün)
> 4. **n8n LLM**: Gemini mi yoksa OpenAI mı kullanılacak? (Mevcut yapıda Gemini görünüyor)
> 5. **Çoklu diyetisyen** desteği ileride planlanıyor mu? (Şu an tek diyetisyen modeli)
