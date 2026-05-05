import asyncio
from datetime import datetime
from time import perf_counter
from uuid import uuid4

from bson import ObjectId

from app.agent.notification_service import notification_service
from app.agent.orchestrator import analyze_single_member
from app.agent.websocket_manager import websocket_manager
from app.models.agent_log import AgentActionType, AgentLog
from app.models.user import Member


def _build_member_query(member_ids: list[str] | None):
    if member_ids is None:
        return Member.find(Member.is_active == True)

    object_ids: list[ObjectId] = []
    for member_id in member_ids:
        try:
            object_ids.append(ObjectId(member_id))
        except Exception:
            continue

    if not object_ids:
        return None
    return Member.find({"_id": {"$in": object_ids}})


async def run_member_batch(
    *,
    triggered_by: str = "scheduler",
    member_ids: list[str] | None = None,
    batch_id: str | None = None,
) -> dict:
    """Tum uyeleri RAM'e toplamaz; cursor benzeri akista tek tek isler."""
    started_at = perf_counter()
    batch_id = batch_id or str(uuid4())
    member_query = _build_member_query(member_ids)
    total_members = await member_query.count() if member_query is not None else 0

    summary = {
        "batch_id": batch_id,
        "started_at": datetime.utcnow().isoformat(),
        "triggered_by": triggered_by,
        "total_members": total_members,
        "processed_members": 0,
        "failed_members": 0,
        "high_risk_members": 0,
        "critical_risk_members": 0,
        "notifications_sent": 0,
        "errors": [],
    }

    await AgentLog(
        action_type=AgentActionType.BATCH_STARTED,
        batch_id=batch_id,
        ai_used=False,
        fallback_used=False,
        execution_time_ms=0,
        details=summary,
        reasoning="Agentic batch baslatildi.",
        triggered_by=triggered_by,
        status="started",
    ).insert()
    await websocket_manager.broadcast("batch_started", summary)

    if member_query is None:
        summary["completed_at"] = datetime.utcnow().isoformat()
        summary["execution_time_ms"] = int((perf_counter() - started_at) * 1000)
        await AgentLog(
            action_type=AgentActionType.BATCH_COMPLETED,
            batch_id=batch_id,
            ai_used=False,
            fallback_used=False,
            execution_time_ms=summary["execution_time_ms"],
            details=summary,
            reasoning="Agentic batch tamamlandi.",
            triggered_by=triggered_by,
            status="completed",
        ).insert()
        await websocket_manager.broadcast("batch_completed", summary)
        return summary

    async for member in member_query:
        member_id = str(member.id)
        member_started_at = perf_counter()
        try:
            await websocket_manager.broadcast(
                "member_started",
                {"batch_id": batch_id, "member_id": member_id, "member_name": member.full_name},
            )
            result = await analyze_single_member(
                member_id,
                triggered_by=triggered_by,
                batch_id=batch_id,
            )
            if result is None:
                raise RuntimeError("member_not_found")

            summary["processed_members"] += 1
            if result.risk_level.value == "HIGH":
                summary["high_risk_members"] += 1
            if result.risk_level.value == "CRITICAL":
                summary["critical_risk_members"] += 1

            notification_result = {"sent": False, "reason": "skipped"}
            if (
                result.status != "INSUFFICIENT_DATA"
                and result.risk_level.value in {"HIGH", "CRITICAL"}
            ):
                notification_result = await notification_service.send_risk_notification(
                    result,
                    batch_id=batch_id,
                    triggered_by=triggered_by,
                )
            if notification_result.get("sent"):
                summary["notifications_sent"] += 1

            await websocket_manager.broadcast(
                "member_completed",
                {
                    "batch_id": batch_id,
                    "member_id": result.member_id,
                    "member_name": result.member_name,
                    "risk_level": result.risk_level.value,
                    "status": result.status.value,
                    "analysis": result.analysis,
                    "recommendation": result.recommendation,
                    "notification_sent": notification_result.get("sent", False),
                    "execution_time_ms": result.execution_time_ms,
                },
            )
        except Exception as exc:
            summary["failed_members"] += 1
            error_payload = {
                "batch_id": batch_id,
                "member_id": member_id,
                "member_name": member.full_name,
                "error": str(exc),
                "execution_time_ms": int((perf_counter() - member_started_at) * 1000),
            }
            summary["errors"].append(error_payload)
            await AgentLog(
                action_type=AgentActionType.BATCH_MEMBER_FAILED,
                member_id=member_id,
                member_name=member.full_name,
                batch_id=batch_id,
                ai_used=False,
                fallback_used=False,
                execution_time_ms=error_payload["execution_time_ms"],
                ai_error=str(exc),
                details=error_payload,
                reasoning="Batch icinde uye islenirken hata olustu.",
                triggered_by=triggered_by,
                status="failed",
            ).insert()
            await websocket_manager.broadcast("member_failed", error_payload)
            await asyncio.sleep(0)

    summary["completed_at"] = datetime.utcnow().isoformat()
    summary["execution_time_ms"] = int((perf_counter() - started_at) * 1000)
    await AgentLog(
        action_type=AgentActionType.BATCH_COMPLETED,
        batch_id=batch_id,
        ai_used=False,
        fallback_used=False,
        execution_time_ms=summary["execution_time_ms"],
        details=summary,
        reasoning="Agentic batch tamamlandi.",
        triggered_by=triggered_by,
        status="completed",
    ).insert()
    await websocket_manager.broadcast("batch_completed", summary)
    return summary
