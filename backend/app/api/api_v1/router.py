from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, dietitians, members, chat, subscriptions, admin, daily_logs, dietitian_dashboard, ai_router, notifications

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dietitians.router, prefix="/dietitians", tags=["dietitians"])
api_router.include_router(members.router, prefix="/members", tags=["members"])
api_router.include_router(chat.router, prefix="/chats", tags=["chats"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["subscriptions"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(daily_logs.router, prefix="/daily-logs", tags=["daily-logs"])
api_router.include_router(dietitian_dashboard.router, prefix="/dietitian", tags=["dietitian-dashboard"])
api_router.include_router(ai_router.router, prefix="/ai", tags=["ai"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])





