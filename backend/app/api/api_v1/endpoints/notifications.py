"""
Notifications Router - Kullanıcıların kendi bildirimlerini yönetmeleri için
"""
from typing import Any, List
from fastapi import APIRouter, Depends
from datetime import datetime

from app.models.user import User
from app.models.notification import Notification, NotificationType
from app.api.api_v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/")
async def get_my_notifications(
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Giriş yapan kullanıcının (üye) bildirimlerini döndürür.
    Okunmamışlar önce, tarih sırasına göre, max 50 bildirim.
    """
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id)
    ).sort(-Notification.created_at).limit(50).to_list()

    return {
        "success": True,
        "unread_count": sum(1 for n in notifications if not n.is_read),
        "notifications": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "type": n.type.value,
                "is_read": n.is_read,
                "sender_name": n.sender_name,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ]
    }


@router.post("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Belirli bir bildirimi okundu olarak işaretle."""
    notif = await Notification.get(notification_id)
    if notif and notif.user_id == str(current_user.id):
        notif.is_read = True
        await notif.save()
    return {"success": True}


@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Tüm bildirimleri okundu olarak işaretle."""
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False
    ).to_list()
    for n in notifications:
        n.is_read = True
        await n.save()
    return {"success": True, "updated": len(notifications)}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Belirli bir bildirimi sil."""
    notif = await Notification.get(notification_id)
    if notif and notif.user_id == str(current_user.id):
        await notif.delete()
    return {"success": True}


@router.delete("/")
async def clear_all_notifications(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Tüm bildirimleri sil."""
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id)
    ).to_list()
    for n in notifications:
        await n.delete()
    return {"success": True, "deleted": len(notifications)}
