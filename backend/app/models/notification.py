"""
Notification modeli - veritabanında saklanan gerçek bildirimler
"""
from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class Notification(Document):
    """
    user_id: bildirimi alacak kullanıcının ID'si (üye)
    sender_name: gönderenin adı (diyetisyen adı)
    title: bildirim başlığı
    message: bildirim mesajı
    type: bildirim tipi
    is_read: okundu mu?
    created_at: oluşturulma zamanı
    """
    user_id: str  # bildirimi alan üyenin ID'si
    sender_name: Optional[str] = None  # diyetisyen adı
    title: str
    message: str
    type: NotificationType = NotificationType.INFO
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
