"""
Diyetisyen hesabı oluşturma scripti.
Kullanım: cd backend && python create_dietitian.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import Dietitian, UserRole, User, Member
from app.models.chat import Chat, Message
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.models.agentic_report import AgenticReport
from app.models.notification import Notification

async def create_dietitian():
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
    
    email = "diyetisyen@dietplatform.com"
    password = "Diet1234!"
    
    # Mevcut diyetisyen var mı kontrol et
    existing = await Dietitian.find_one(Dietitian.email == email)
    if existing:
        print(f"Diyetisyen zaten mevcut: {email}")
        print(f"  ID: {existing.id}")
        print(f"  Ad: {existing.full_name}")
        print(f"  Aktif: {existing.is_active}")
        client.close()
        return
    
    hashed = get_password_hash(password)
    dietitian = Dietitian(
        email=email,
        hashed_password=hashed,
        full_name="Uzm. Dyt. Ayşe Yılmaz",
        role=UserRole.DIETITIAN,
        is_active=True,
        title="Uzman Diyetisyen",
        specialization="Klinik Beslenme ve Sporcu Beslenmesi",
        experience_years=8,
        bio="İstanbul Üniversitesi Beslenme ve Diyetetik bölümü mezunuyum. 8 yıllık klinik deneyimim ile sağlıklı yaşam ve kilo yönetimi konusunda uzmanlaşmış bulunuyorum."
    )
    await dietitian.create()
    
    print("=" * 50)
    print("Diyetisyen hesabı başarıyla oluşturuldu!")
    print("=" * 50)
    print(f"  E-posta : {email}")
    print(f"  Şifre   : {password}")
    print(f"  Ad      : {dietitian.full_name}")
    print(f"  ID      : {dietitian.id}")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_dietitian())
