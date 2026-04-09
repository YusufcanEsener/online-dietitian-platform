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

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
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
            Notification
        ]
    )
    return client


