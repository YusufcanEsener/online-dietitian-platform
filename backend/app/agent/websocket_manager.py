import asyncio
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from fastapi import WebSocket

from app.core.config import settings


@dataclass
class ConnectionState:
    websocket: WebSocket
    queue: asyncio.Queue[dict[str, Any]] = field(default_factory=lambda: asyncio.Queue(maxsize=200))
    sender_task: asyncio.Task | None = None


class WebSocketManager:
    """Mesaj flood'unu engellemek icin queue + delay kullanan baglanti yoneticisi."""

    def __init__(self) -> None:
        self._connections: dict[str, ConnectionState] = {}
        self._history: deque[dict[str, Any]] = deque(maxlen=250)
        self._delay_seconds = max(0.05, settings.AGENT_WEBSOCKET_DELAY_MS / 1000)
        self._lock = asyncio.Lock()

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    def get_history(self) -> list[dict[str, Any]]:
        return list(self._history)

    async def connect(self, client_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        state = ConnectionState(websocket=websocket)
        state.sender_task = asyncio.create_task(self._sender_loop(client_id, state))
        async with self._lock:
            self._connections[client_id] = state

    async def disconnect(self, client_id: str) -> None:
        async with self._lock:
            state = self._connections.pop(client_id, None)
        if not state:
            return
        current_task = asyncio.current_task()
        if state.sender_task and state.sender_task is not current_task:
            state.sender_task.cancel()
            try:
                await state.sender_task
            except asyncio.CancelledError:
                pass
        try:
            await state.websocket.close()
        except Exception:
            pass

    async def shutdown(self) -> None:
        for client_id in list(self._connections.keys()):
            await self.disconnect(client_id)

    async def broadcast(self, event_type: str, payload: dict[str, Any]) -> None:
        event = {
            "event_type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "payload": payload,
        }
        self._history.appendleft(event)

        async with self._lock:
            states = list(self._connections.values())

        for state in states:
            if state.queue.full():
                try:
                    state.queue.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            await state.queue.put(event)

    async def _sender_loop(self, client_id: str, state: ConnectionState) -> None:
        try:
            while True:
                event = await state.queue.get()
                await state.websocket.send_json(event)
                await asyncio.sleep(self._delay_seconds)
        except Exception:
            await self.disconnect(client_id)


websocket_manager = WebSocketManager()
