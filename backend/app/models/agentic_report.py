"""
Agentic AI Report Model - Günlük raporları saklamak için
"""
from typing import Optional, List
from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime


class AgenticMemberStatus(BaseModel):
    """Danışan durum bilgisi"""
    id: str
    name: str
    email: str
    status: str  # critical, warning, good
    problem: Optional[str] = None
    days_since_last_log: Optional[int] = None
    program_status: str
    calorie_compliance: int
    recommendation: Optional[str] = None


class AgenticReport(Document):
    """Günlük Agentic AI Raporu"""
    dietitian_id: str
    dietitian_name: Optional[str] = None
    report_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Özet bilgiler
    total_members: int = 0
    critical_count: int = 0
    warning_count: int = 0
    good_count: int = 0
    
    # Danışan detayları
    members: List[AgenticMemberStatus] = []
    
    # AI tarafından oluşturulan mesaj (Telegram için)
    ai_message: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "agentic_reports"
