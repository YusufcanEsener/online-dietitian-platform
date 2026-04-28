"""
AgentLog modeli - Agentic AI'ın her otonom eyleminin kaydı
"""
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
    member_name: Optional[str] = None
    details: Dict[str, Any] = {}
    reasoning: Optional[str] = None         # AI'ın neden bu kararı verdiği
    n8n_execution_id: Optional[str] = None
    triggered_by: str = "cron"              # cron | webhook | manual
    status: str = "completed"               # completed | failed | pending
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agent_logs"
