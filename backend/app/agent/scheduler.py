import asyncio
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.agent.batch_runner import run_member_batch
from app.agent.websocket_manager import websocket_manager
from app.core.config import settings
from app.models.agent_scheduler_lock import AgentSchedulerLock

logger = logging.getLogger(__name__)


class AgentScheduler:
    LOCK_NAME = "agent_scheduler"

    def __init__(self) -> None:
        self.instance_id = settings.AGENT_INSTANCE_ID
        self._runner_task: asyncio.Task | None = None
        self._heartbeat_task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()
        self._current_batch_id: str | None = None
        self._last_batch_summary: dict | None = None
        self._next_run_at: datetime | None = None
        self._has_lock = False
        self._running = False

    @property
    def is_running(self) -> bool:
        return self._running

    def get_state(self) -> dict:
        return {
            "enabled": settings.ENABLE_AGENT,
            "running": self._running,
            "instance_id": self.instance_id,
            "has_lock": self._has_lock,
            "current_batch_id": self._current_batch_id,
            "next_run_at": self._next_run_at.isoformat() if self._next_run_at else None,
            "last_batch_summary": self._last_batch_summary,
            "timezone": settings.AGENT_SCHEDULER_TIMEZONE,
            "run_hour_local": settings.AGENT_SCHEDULER_RUN_HOUR_LOCAL,
            "run_minute_local": settings.AGENT_SCHEDULER_RUN_MINUTE_LOCAL,
        }

    async def start(self) -> None:
        if not settings.ENABLE_AGENT or self._runner_task:
            return
        self._stop_event.clear()
        self._runner_task = asyncio.create_task(self._run_loop())

    async def stop(self) -> None:
        self._stop_event.set()
        if self._runner_task:
            self._runner_task.cancel()
            try:
                await self._runner_task
            except asyncio.CancelledError:
                pass
            self._runner_task = None
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
            self._heartbeat_task = None
        await self._release_lock()

    async def _run_loop(self) -> None:
        while not self._stop_event.is_set():
            try:
                if not self._has_lock:
                    self._has_lock = await self._acquire_lock()
                    if self._has_lock:
                        self._running = True
                        self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                        await websocket_manager.broadcast(
                            "scheduler_acquired",
                            {"instance_id": self.instance_id},
                        )

                if not self._has_lock:
                    await asyncio.sleep(10)
                    continue

                self._next_run_at = self._calculate_next_run_at()
                await self._sleep_until_next_run()
                if self._stop_event.is_set() or not self._has_lock:
                    continue

                summary = await run_member_batch(triggered_by="scheduler")
                self._current_batch_id = summary["batch_id"]
                self._last_batch_summary = summary
                await websocket_manager.broadcast("scheduler_cycle_completed", summary)
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.exception("Agent scheduler error: %s", exc)
                await websocket_manager.broadcast(
                    "scheduler_error",
                    {"instance_id": self.instance_id, "error": str(exc)},
                )
                await asyncio.sleep(10)

    async def _heartbeat_loop(self) -> None:
        try:
            while not self._stop_event.is_set():
                await asyncio.sleep(max(5, settings.AGENT_LOCK_TTL_SECONDS // 3))
                await self._renew_lock()
        except asyncio.CancelledError:
            raise

    def _calculate_next_run_at(self) -> datetime:
        tz = ZoneInfo(settings.AGENT_SCHEDULER_TIMEZONE)
        now_local = datetime.now(tz)
        target_local = now_local.replace(
            hour=settings.AGENT_SCHEDULER_RUN_HOUR_LOCAL,
            minute=settings.AGENT_SCHEDULER_RUN_MINUTE_LOCAL,
            second=0,
            microsecond=0,
        )
        if target_local <= now_local:
            target_local += timedelta(days=1)
        target_utc = target_local.astimezone(timezone.utc)
        return target_utc.replace(tzinfo=None)

    async def _sleep_until_next_run(self) -> None:
        if self._next_run_at is None:
            return
        wait_seconds = max(1, int((self._next_run_at - datetime.utcnow()).total_seconds()))
        try:
            await asyncio.wait_for(self._stop_event.wait(), timeout=wait_seconds)
        except asyncio.TimeoutError:
            return

    async def _acquire_lock(self) -> bool:
        collection = AgentSchedulerLock.get_pymongo_collection()
        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=settings.AGENT_LOCK_TTL_SECONDS)
        existing = await collection.find_one({"lock_name": self.LOCK_NAME})

        if existing is None:
            try:
                await collection.insert_one(
                    {
                        "lock_name": self.LOCK_NAME,
                        "holder_id": self.instance_id,
                        "acquired_at": now,
                        "heartbeat_at": now,
                        "expires_at": expires_at,
                    }
                )
                return True
            except DuplicateKeyError:
                existing = await collection.find_one({"lock_name": self.LOCK_NAME})

        if existing is None:
            return False

        document = await collection.find_one_and_update(
            {
                "_id": existing["_id"],
                "$or": [
                    {"holder_id": self.instance_id},
                    {"expires_at": {"$lt": now}},
                ],
            },
            {
                "$set": {
                    "holder_id": self.instance_id,
                    "acquired_at": existing.get("acquired_at", now),
                    "heartbeat_at": now,
                    "expires_at": expires_at,
                }
            },
            return_document=ReturnDocument.AFTER,
        )
        return bool(document and document.get("holder_id") == self.instance_id)

    async def _renew_lock(self) -> None:
        if not self._has_lock:
            return
        collection = AgentSchedulerLock.get_pymongo_collection()
        now = datetime.utcnow()
        result = await collection.update_one(
            {"lock_name": self.LOCK_NAME, "holder_id": self.instance_id},
            {
                "$set": {
                    "heartbeat_at": now,
                    "expires_at": now + timedelta(seconds=settings.AGENT_LOCK_TTL_SECONDS),
                }
            },
        )
        if result.modified_count == 0:
            self._has_lock = False
            self._running = False

    async def _release_lock(self) -> None:
        collection = AgentSchedulerLock.get_pymongo_collection()
        await collection.delete_one({"lock_name": self.LOCK_NAME, "holder_id": self.instance_id})
        self._has_lock = False
        self._running = False


agent_scheduler = AgentScheduler()
