import asyncio
from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from pydantic import BaseModel

from app.agent.batch_runner import run_member_batch
from app.agent.scheduler import agent_scheduler
from app.agent.websocket_manager import websocket_manager
from app.api.api_v1.endpoints.auth import get_current_user
from app.core import security
from app.core.config import settings
from app.models.agent_log import AgentActionType, AgentLog
from app.models.user import Dietitian, Member, User, UserRole

router = APIRouter()
_background_batch_tasks: set[asyncio.Task] = set()


class RunBatchRequest(BaseModel):
    member_ids: list[str] | None = None


async def get_admin_or_dietitian_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.DIETITIAN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Dietitian or Admin access required")
    return current_user


async def _get_ws_admin_or_dietitian(token: str) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = await Dietitian.get(user_id)
    if not user:
        user = await User.get(user_id)
        
    if not user or user.role not in [UserRole.DIETITIAN, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Dietitian or Admin access required")
    return user


@router.get("/monitoring")
async def get_agent_monitoring(
    current_user: User = Depends(get_admin_or_dietitian_user),
    limit: int = Query(default=50, ge=1, le=200),
):
    _ = current_user
    logs = await AgentLog.find().sort("-created_at").limit(limit).to_list()
    recent_cutoff = datetime.utcnow() - timedelta(hours=24)
    total_members = await Member.find(Member.is_active == True).count()
    recent_batches = await AgentLog.find(
        AgentLog.action_type == AgentActionType.BATCH_COMPLETED,
        AgentLog.created_at >= recent_cutoff,
    ).count()

    return {
        "success": True,
        "scheduler": agent_scheduler.get_state(),
        "summary": {
            "total_members": total_members,
            "recent_batches_24h": recent_batches,
            "websocket_clients": websocket_manager.connection_count,
        },
        "history": websocket_manager.get_history(),
        "logs": [
            {
                "id": str(log.id),
                "action_type": log.action_type.value if hasattr(log.action_type, "value") else log.action_type,
                "member_id": log.member_id,
                "member_name": log.member_name,
                "batch_id": log.batch_id,
                "risk_level": log.risk_level,
                "ai_used": log.ai_used,
                "fallback_used": log.fallback_used,
                "execution_time_ms": log.execution_time_ms,
                "ai_error": log.ai_error,
                "details": log.details,
                "reasoning": log.reasoning,
                "triggered_by": log.triggered_by,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
    }


@router.post("/monitoring/run")
async def run_agent_monitoring_batch(
    request: RunBatchRequest,
    current_user: User = Depends(get_admin_or_dietitian_user),
):
    _ = current_user
    batch_id = str(uuid4())

    async def _run_in_background() -> None:
        try:
            await run_member_batch(
                triggered_by="manual_batch",
                member_ids=request.member_ids,
                batch_id=batch_id,
            )
        finally:
            current_task = asyncio.current_task()
            if current_task is not None:
                _background_batch_tasks.discard(current_task)

    task = asyncio.create_task(_run_in_background())
    _background_batch_tasks.add(task)

    await websocket_manager.broadcast(
        "manual_batch_started",
        {
            "batch_id": batch_id,
            "triggered_by": "manual_batch",
            "requested_member_count": len(request.member_ids or []),
        },
    )

    return {"success": True, "batch_id": batch_id, "status": "accepted"}


@router.websocket("/monitoring/ws")
async def agent_monitoring_ws(
    websocket: WebSocket,
    token: str = Query(...),
):
    try:
        user = await _get_ws_admin_or_dietitian(token)
    except HTTPException as exc:
        await websocket.close(code=4403 if exc.status_code == 403 else 4401)
        return

    client_id = f"{user.id}-{uuid4()}"
    await websocket_manager.connect(client_id, websocket)
    await websocket.send_json(
        {
            "event_type": "initial_state",
            "timestamp": datetime.utcnow().isoformat(),
            "payload": {
                "scheduler": agent_scheduler.get_state(),
                "history": websocket_manager.get_history(),
            },
        }
    )

    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await websocket.send_json(
                    {
                        "event_type": "heartbeat",
                        "timestamp": datetime.utcnow().isoformat(),
                        "payload": {"websocket_clients": websocket_manager.connection_count},
                    }
                )
    except WebSocketDisconnect:
        pass
    finally:
        await websocket_manager.disconnect(client_id)
