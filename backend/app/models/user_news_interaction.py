from beanie import Document, Indexed
from pydantic import Field
from datetime import datetime
from typing import Optional
from bson import ObjectId

class UserNewsInteraction(Document):
    user_id: str
    news_id: str
    is_read: bool = False
    is_favorite: bool = False
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "user_news_interactions"
        # We might want to query by user_id or by user_id + news_id
        indexes = [
            "user_id",
            ["user_id", "news_id"]
        ]
