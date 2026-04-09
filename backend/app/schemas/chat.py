from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    content: str
    timestamp: datetime

class ParticipantDetails(BaseModel):
    name: str  # Full name
    title: Optional[str] = None  # For dietitians

class ChatResponse(BaseModel):
    id: str
    participants: List[str]
    status: str = "pending"
    other_participant: Optional[ParticipantDetails] = None
    last_message: Optional[MessageResponse] = None
