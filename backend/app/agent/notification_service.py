import asyncio
from datetime import datetime, timedelta

from app.agent.schemas import AnalyzeMemberResponse, RiskLevel
from app.core.config import settings
from app.models.agent_log import AgentActionType, AgentLog
from app.models.notification import Notification, NotificationType


class AgentNotificationService:
    """Ayni uye icin tekrarli bildirim spam'ini engeller."""

    def __init__(self) -> None:
        self._member_locks: dict[str, asyncio.Lock] = {}

    def _get_lock(self, member_id: str) -> asyncio.Lock:
        if member_id not in self._member_locks:
            self._member_locks[member_id] = asyncio.Lock()
        return self._member_locks[member_id]

    async def send_risk_notification(
        self,
        result: AnalyzeMemberResponse,
        *,
        batch_id: str | None,
        triggered_by: str,
    ) -> dict:
        if result.risk_level not in {RiskLevel.HIGH, RiskLevel.CRITICAL}:
            return {"sent": False, "reason": "risk_not_high_enough"}

        member_lock = self._get_lock(result.member_id)
        async with member_lock:
            cutoff = datetime.utcnow() - timedelta(hours=settings.AGENT_NOTIFICATION_COOLDOWN_HOURS)
            existing = await Notification.find_one(
                Notification.user_id == result.member_id,
                Notification.sender_name == "Agentic AI",
                Notification.created_at >= cutoff,
            )
            if existing:
                await self._save_log(
                    result=result,
                    batch_id=batch_id,
                    triggered_by=triggered_by,
                    sent=False,
                    reason="cooldown_active",
                )
                return {"sent": False, "reason": "cooldown_active"}

            notification = Notification(
                user_id=result.member_id,
                sender_name="Agentic AI",
                title="Kritik takip gerekli" if result.risk_level == RiskLevel.CRITICAL else "Takip gerekiyor",
                message=result.recommendation or result.analysis,
                type=NotificationType.ERROR if result.risk_level == RiskLevel.CRITICAL else NotificationType.WARNING,
            )
            await notification.insert()

            await self._save_log(
                result=result,
                batch_id=batch_id,
                triggered_by=triggered_by,
                sent=True,
                reason="sent",
                notification_id=str(notification.id),
            )
            return {"sent": True, "notification_id": str(notification.id)}

    async def _save_log(
        self,
        *,
        result: AnalyzeMemberResponse,
        batch_id: str | None,
        triggered_by: str,
        sent: bool,
        reason: str,
        notification_id: str | None = None,
    ) -> None:
        details = {
            "risk_level": result.risk_level.value,
            "reason": reason,
            "sent": sent,
        }
        if notification_id:
            details["notification_id"] = notification_id

        log = AgentLog(
            action_type=AgentActionType.RISK_NOTIFICATION_SENT,
            member_id=result.member_id,
            member_name=result.member_name,
            batch_id=batch_id,
            risk_level=result.risk_level.value,
            ai_used=result.ai_used,
            fallback_used=result.fallback_used,
            execution_time_ms=result.execution_time_ms,
            ai_error=result.ai_error,
            details=details,
            reasoning=result.recommendation or result.analysis,
            triggered_by=triggered_by,
            status="completed" if sent else "skipped",
        )
        await log.insert()


notification_service = AgentNotificationService()
