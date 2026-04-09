"""
Admin hesabı oluşturma scripti.
Kullanım: cd backend && venv\Scripts\python create_admin.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User, UserRole, Dietitian, Member
from app.models.chat import Chat, Message
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.models.agentic_report import AgenticReport
from app.models.notification import Notification

async def create_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.DATABASE_NAME]
    
    await init_beanie(
        database=database,
        document_models=[
            User, Dietitian, Member,
            Chat, Message,
            SubscriptionPlan, UserSubscription,
            DailyLog, NutritionPlan,
            AgenticReport, Notification
        ]
    )
    
    email = "admin@diyetisyen.com"
    password = "admin123"
    
    # Mevcut admin var mı kontrol et
    existing = await User.find_one(User.email == email)
    if existing:
        print(f"Admin zaten mevcut: {email}")
        print(f"  ID: {existing.id}")
        print(f"  Ad: {existing.full_name}")
        print(f"  Aktif: {existing.is_active}")
        client.close()
        return
    
    hashed = get_password_hash(password)
    admin = User(
        email=email,
        hashed_password=hashed,
        full_name="Admin",
        role=UserRole.ADMIN,
        is_active=True,
    )
    await admin.create()
    
    print("=" * 50)
    print("Admin hesabı başarıyla oluşturuldu!")
    print("=" * 50)
    print(f"  E-posta : {email}")
    print(f"  Şifre   : {password}")
    print(f"  Ad      : {admin.full_name}")
    print(f"  ID      : {admin.id}")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
