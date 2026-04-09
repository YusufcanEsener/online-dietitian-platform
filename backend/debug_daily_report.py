import asyncio
import traceback
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

async def main():
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        await init_beanie(
            database=client[settings.DATABASE_NAME],
            document_models=[User, Dietitian, Member, Chat, Message, SubscriptionPlan, 
                             UserSubscription, DailyLog, NutritionPlan, AgenticReport, Notification]
        )
        print("DB Initialized")
        
        dietitian = await Dietitian.find_one(Dietitian.email == "diyetisyen@dietplatform.com")
        if not dietitian:
            print("Dietitian not found")
            return
            
        print(f"Dietitian ID: {dietitian.id}")
        
        from datetime import date
        today = date.today()
        
        all_members = await Member.find_all().to_list()
        print(f"Found {len(all_members)} members")
        
        members_data = []
        for member in all_members:
            # 1. Test DailyLog query
            daily_logs = await DailyLog.find(
                DailyLog.member_id == str(member.id)
            ).sort(-DailyLog.log_date).limit(7).to_list()
            print(f"Member {member.id} logs fetched: {len(daily_logs)}")
            
            # 2. Test NutritionPlan query
            active_plan = await NutritionPlan.find_one(
                NutritionPlan.member_id == str(member.id),
                NutritionPlan.is_active == True
            )
            print(f"Member {member.id} plan fetched: {'Yes' if active_plan else 'No'}")
            
            # 3. Test loop calculation logic
            total_calories = 0
            last_log_date = None
            logs_summary = []
            
            for log in daily_logs:
                logs_summary.append({
                    "date": str(log.log_date),
                    "calories": log.calories_consumed,
                    "protein": log.protein,
                    "carbs": log.carbs,
                    "fat": log.fat
                })
                total_calories += log.calories_consumed
                if last_log_date is None:
                    last_log_date = log.log_date
                    
            target_calories = active_plan.daily_targets.calories if active_plan else 2000
            print(f"Target logic OK")

        print("All DB operations successful. Testing N8N service format...")
        from app.services.n8n_service import n8n_service
        
        n8n_payload = {
            "dietitian_name": dietitian.full_name,
            "report_date": date.today().strftime("%Y-%m-%d"),
            "total_members": len(all_members),
            "members": members_data,
            "request_type": "daily_report"
        }
        
        print("Sending to N8N (this might fail or timeout if N8N is not running, which is expected)")
        # result = await n8n_service.daily_report(n8n_payload)
        # print("N8N response:", result)
        
    except Exception as e:
        print("Exception occurred:")
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(main())
