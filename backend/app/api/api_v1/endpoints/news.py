from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from datetime import datetime

from app.api.api_v1.endpoints.auth import get_current_user
from app.models.user import User, UserRole
from app.models.pubmed_news import PubMedNews

router = APIRouter()


# ─── Response Schemas ───────────────────────────────────────────────────────

class PubMedNewsResponse(BaseModel):
    id: str
    title: str
    title_tr: Optional[str] = None
    link: str
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    summary_tr: str
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── n8n Internal Write Schema ───────────────────────────────────────────────

class PubMedNewsCreate(BaseModel):
    title: str
    title_tr: str
    link: str
    description: Optional[str] = None
    published_at: Optional[datetime] = None
    summary_tr: str
    source: str = "pubmed"


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/", response_model=List[PubMedNewsResponse])
async def get_news(
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
) -> Any:
    """
    Diyetisyen rolündeki kullanıcılar için PubMed haberlerini listeler.
    Sadece 'dietitian' rolü erişebilir.
    """
    if current_user.role != UserRole.DIETITIAN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu içeriğe yalnızca diyetisyenler erişebilir.",
        )

    news_list = (
        await PubMedNews.find()
        .sort(-PubMedNews.created_at)
        .skip(skip)
        .limit(limit)
        .to_list()
    )

    return [
        PubMedNewsResponse(
            id=str(item.id),
            title=item.title,
            title_tr=item.title_tr,
            link=item.link,
            description=item.description,
            published_at=item.published_at,
            summary_tr=item.summary_tr,
            source=item.source,
            created_at=item.created_at,
        )
        for item in news_list
    ]


@router.post("/internal/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_news(
    payload: PubMedNewsCreate,
    x_n8n_secret: str = Header(default=None, alias="X-N8N-Secret"),
) -> Any:
    """
    n8n iş akışının PubMed haberlerini backend'e kaydetmesi için iç endpoint.
    Header: X-N8N-Secret ile korunur.

    Bu endpoint dışarıya açık değildir — yalnızca backend-net içindeki
    n8n container'ı tarafından kullanılır.
    """
    import os
    expected_secret = os.environ.get("N8N_INGEST_SECRET", "")
    if not expected_secret or x_n8n_secret != expected_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz ya da eksik servis anahtarı.",
        )

    # Duplicate kontrolü: aynı link varsa güncelle, yoksa ekle
    existing = await PubMedNews.find_one(PubMedNews.link == payload.link)
    if existing:
        existing.summary_tr = payload.summary_tr
        existing.title = payload.title
        existing.title_tr = payload.title_tr
        existing.description = payload.description
        if payload.published_at:
            existing.published_at = payload.published_at
        await existing.save()
        return {"status": "updated", "id": str(existing.id)}

    news = PubMedNews(
        title=payload.title,
        title_tr=payload.title_tr,
        link=payload.link,
        description=payload.description,
        published_at=payload.published_at,
        summary_tr=payload.summary_tr,
        source=payload.source,
    )
    await news.create()
    return {"status": "created", "id": str(news.id)}

# ─── Interactions Endpoints ─────────────────────────────────────────────────

from app.models.user_news_interaction import UserNewsInteraction

class InteractionUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_favorite: Optional[bool] = None

class InteractionResponse(BaseModel):
    news_id: str
    is_read: bool
    is_favorite: bool

@router.get("/interactions", response_model=List[InteractionResponse])
async def get_interactions(
    current_user: User = Depends(get_current_user),
) -> Any:
    interactions = await UserNewsInteraction.find(UserNewsInteraction.user_id == str(current_user.id)).to_list()
    return [
        InteractionResponse(
            news_id=item.news_id,
            is_read=item.is_read,
            is_favorite=item.is_favorite
        )
        for item in interactions
    ]

@router.post("/{news_id}/interact", response_model=InteractionResponse)
async def update_interaction(
    news_id: str,
    payload: InteractionUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    interaction = await UserNewsInteraction.find_one(
        UserNewsInteraction.user_id == str(current_user.id),
        UserNewsInteraction.news_id == news_id
    )
    
    if not interaction:
        interaction = UserNewsInteraction(
            user_id=str(current_user.id),
            news_id=news_id,
            is_read=payload.is_read if payload.is_read is not None else False,
            is_favorite=payload.is_favorite if payload.is_favorite is not None else False
        )
    else:
        if payload.is_read is not None:
            interaction.is_read = payload.is_read
        if payload.is_favorite is not None:
            interaction.is_favorite = payload.is_favorite
        interaction.updated_at = datetime.utcnow()
        
    await interaction.save()
    return InteractionResponse(
        news_id=interaction.news_id,
        is_read=interaction.is_read,
        is_favorite=interaction.is_favorite
    )
