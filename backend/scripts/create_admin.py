"""
Admin hesabı oluşturma scripti (GÜVENLİ).
Kullanım:
  docker compose exec backend python -m scripts.create_admin
"""
import asyncio
import os
import secrets
import string
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


def generate_strong_password(length: int = 24) -> str:
    """Güçlü rastgele şifre oluştur."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


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
    
    email = os.environ.get("ADMIN_EMAIL", "admin@diyetisyen.com")
    password = os.environ.get("ADMIN_PASSWORD", generate_strong_password())
    
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
    print("⚠️  Bu şifreyi kaydedin! Tekrar gösterilmeyecek.")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
