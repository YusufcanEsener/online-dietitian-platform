from typing import Optional
from beanie import Document
from pydantic import Field
from datetime import datetime


class PubMedNews(Document):
    """PubMed'den çekilen ve AI ile özetlenen makale haberleri."""

    title: str
    title_tr: Optional[str] = None
    link: str = Field(unique=True)
    description: Optional[str] = None       # RSS'den gelen ham abstract
    published_at: Optional[datetime] = None  # Makalenin yayın tarihi
    summary_tr: str                          # n8n AI node'u tarafından Türkçe özet
    source: str = "pubmed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "pubmed_news"
        # link alanında unique index — duplicate kayıt önlenir
        indexes = ["link"]
