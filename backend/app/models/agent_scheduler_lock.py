"""
Scheduler singleton kilidi - birden fazla instance'in ayni batch'i calistirmasini engeller.
"""
from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class AgentSchedulerLock(Document):
    lock_name: str = "agent_scheduler"
    holder_id: str
    batch_id: Optional[str] = None
    acquired_at: datetime = Field(default_factory=datetime.utcnow)
    heartbeat_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime

    class Settings:
        name = "agent_scheduler_locks"
        indexes = [
            IndexModel([("lock_name", ASCENDING)], unique=True),
        ]
