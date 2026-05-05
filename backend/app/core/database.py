import logging

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.models.agent_log import AgentLog
from app.models.agent_scheduler_lock import AgentSchedulerLock
from app.models.agentic_report import AgenticReport
from app.models.chat import Chat, Message
from app.models.daily_log import DailyLog
from app.models.notification import Notification
from app.models.nutrition_plan import NutritionPlan
from app.models.pubmed_news import PubMedNews
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.task_queue import AgentTask
from app.models.user import Dietitian, Member, User
from app.models.user_news_interaction import UserNewsInteraction

logger = logging.getLogger(__name__)


async def init_db():
    """
    MongoDB baglantisini baslat.
    MONGODB_URL icinde auth bilgileri bulunmalidir:
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

        await client.admin.command("ping")
        logger.info("MongoDB baglantisi basarili.")

        database = client[settings.DATABASE_NAME]
        await init_beanie(
            database=database,
            document_models=[
                User,
                Dietitian,
                Member,
                Chat,
                Message,
                SubscriptionPlan,
                UserSubscription,
                DailyLog,
                NutritionPlan,
                AgenticReport,
                Notification,
                PubMedNews,
                UserNewsInteraction,
                AgentLog,
                AgentSchedulerLock,
                AgentTask,
            ],
        )
        return client
    except Exception as exc:
        logger.error("MongoDB baglanti hatasi: %s", exc)
        raise
