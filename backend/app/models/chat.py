from typing import List, Optional
from beanie import Document
from pydantic import Field
from datetime import datetime

class Chat(Document):
    participants: List[str] = []  # List of user_ids
    member_id: Optional[str] = None  # Üye ID'si
    dietitian_id: Optional[str] = None  # Diyetisyen ID'si
    status: str = "active"  # active, pending, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "chats"

class Message(Document):
    chat_id: str
    sender_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "messages"
