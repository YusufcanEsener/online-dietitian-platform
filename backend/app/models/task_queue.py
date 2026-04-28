"""
AgentTask modeli - Asenkron görev kuyruğu
"""
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
