from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.user import User, Dietitian, Member
from app.models.chat import Chat, Message
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.models.agentic_report import AgenticReport
from app.models.notification import Notification
from app.models.pubmed_news import PubMedNews
from app.models.user_news_interaction import UserNewsInteraction
import logging

logger = logging.getLogger(__name__)

async def init_db():
    """
    MongoDB bağlantısını başlat.
    MONGODB_URL içinde auth bilgileri bulunmalıdır:
    mongodb://username:password@host:port/dbname?authSource=admin
    """
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5,
        )
        
        # Bağlantı testi
        await client.admin.command("ping")
        logger.info("MongoDB bağlantısı başarılı.")
        
        database = client[settings.DATABASE_NAME]
        
        await init_beanie(
            database=database,
            document_models=[
                User, Dietitian, Member,
                Chat, Message,
                SubscriptionPlan, UserSubscription,
                DailyLog,
                NutritionPlan,
                AgenticReport,
                Notification,
                PubMedNews,
                UserNewsInteraction
            ]
        )
        return client
    except Exception as e:
        logger.error(f"MongoDB bağlantı hatası: {e}")
        raise
