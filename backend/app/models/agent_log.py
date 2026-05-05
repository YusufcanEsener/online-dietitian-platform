"""
AgentLog modeli - Agentic AI'in her otonom eyleminin kaydi
"""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from beanie import Document
from pydantic import Field


class AgentActionType(str, Enum):
    MEMBER_ANALYSIS = "member_analysis"
    BATCH_STARTED = "batch_started"
    BATCH_COMPLETED = "batch_completed"
    BATCH_MEMBER_FAILED = "batch_member_failed"
    RISK_NOTIFICATION_SENT = "risk_notification_sent"
    NOTIFICATION_SENT = "notification_sent"
    PLAN_EXPIRY_ALERT = "plan_expiry_alert"
    INACTIVITY_WARNING = "inactivity_warning"
    ADHERENCE_CHECK = "adherence_check"
    ESCALATION_TO_DIETITIAN = "escalation_to_dietitian"
    PLAN_SUGGESTION = "plan_suggestion"
    WHATSAPP_SENT = "whatsapp_sent"
    WEEKLY_REPORT = "weekly_report"


class AgentLog(Document):
    """Ajanin her otonom eyleminin kaydi."""

    action_type: AgentActionType
    member_id: Optional[str] = None
    member_name: Optional[str] = None
    batch_id: Optional[str] = None
    risk_level: Optional[str] = None
    ai_used: Optional[bool] = None
    fallback_used: Optional[bool] = None
    execution_time_ms: Optional[int] = None
    ai_error: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    reasoning: Optional[str] = None
    n8n_execution_id: Optional[str] = None
    triggered_by: str = "cron"
    status: str = "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agent_logs"
