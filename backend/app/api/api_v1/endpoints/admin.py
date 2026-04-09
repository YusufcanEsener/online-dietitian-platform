from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User, Dietitian, Member, UserRole
from app.models.chat import Chat, Message
from app.models.subscription import SubscriptionPlan, UserSubscription
from app.api.api_v1.endpoints.auth import get_current_user
from app.schemas.user import AdminUserUpdate, DietitianCreate
from app.core import security
from datetime import datetime

router = APIRouter()

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Admin kullanıcısını doğrular."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Admin dashboard istatistiklerini döndürür."""
    # Kullanıcı sayıları
    total_members = await Member.count()
    
    # Aktif abonelikler
    active_subscriptions = await UserSubscription.find(
        UserSubscription.is_active == True
    ).count()
    
    # Toplam sohbet ve mesaj
    total_chats = await Chat.count()
    total_messages = await Message.count()
    
    # Abonelik planları
    total_plans = await SubscriptionPlan.count()
    
    return {
        "total_users": total_members,
        "total_members": total_members,
        "active_subscriptions": active_subscriptions,
        "total_chats": total_chats,
        "total_messages": total_messages,
        "total_plans": total_plans,
    }

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Tüm kullanıcıları listeler (üyeler)."""
    members = await Member.find_all().skip(skip).limit(limit).to_list()
    
    users = []
    for m in members:
        users.append({
            "id": str(m.id),
            "email": m.email,
            "full_name": m.full_name,
            "role": m.role.value if hasattr(m.role, 'value') else m.role,
            "is_active": m.is_active,
            "subscription_status": m.subscription_status,
            "password_changed_at": m.password_changed_at.isoformat() if m.password_changed_at else None,
        })
    
    return users

@router.put("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: str,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Kullanıcının aktiflik durumunu değiştirir."""
    user = await Member.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = not user.is_active
    await user.save()
    
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_update: AdminUserUpdate,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Admin tarafından kullanıcı bilgilerini günceller."""
    user = await Member.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Email güncelleme
    if user_update.email and user_update.email != user.email:
        # Email benzersizliğini kontrol et
        existing = await Member.find_one(Member.email == user_update.email)
        if not existing:
            existing = await User.find_one(User.email == user_update.email)
        if existing and str(existing.id) != user_id:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor")
        user.email = user_update.email
    
    # Full name güncelleme
    if user_update.full_name is not None:
        user.full_name = user_update.full_name
    
    # Şifre güncelleme
    if user_update.password:
        user.hashed_password = security.get_password_hash(user_update.password)
        user.password_changed_at = datetime.utcnow()
    
    await user.save()
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else user.role,
        "is_active": user.is_active,
        "password_changed_at": user.password_changed_at.isoformat() if user.password_changed_at else None,
    }


# ==========================================
# DİYETİSYEN YÖNETİMİ ENDPOINT'LERİ
# ==========================================

@router.get("/dietitian")
async def get_dietitian_info(
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Mevcut diyetisyen bilgisini döndürür (varsa)."""
    dietitian = await Dietitian.find_one(Dietitian.is_active == True)
    if not dietitian:
        # Pasif diyetisyen var mı kontrol et
        inactive = await Dietitian.find_one()
        if inactive:
            return {
                "exists": True,
                "is_active": False,
                "dietitian": {
                    "id": str(inactive.id),
                    "email": inactive.email,
                    "full_name": inactive.full_name,
                    "role": inactive.role.value if hasattr(inactive.role, 'value') else inactive.role,
                    "is_active": inactive.is_active,
                    "title": inactive.title,
                    "specialization": inactive.specialization,
                    "experience_years": inactive.experience_years,
                    "bio": inactive.bio,
                }
            }
        return {"exists": False, "dietitian": None}
    
    return {
        "exists": True,
        "is_active": True,
        "dietitian": {
            "id": str(dietitian.id),
            "email": dietitian.email,
            "full_name": dietitian.full_name,
            "role": dietitian.role.value if hasattr(dietitian.role, 'value') else dietitian.role,
            "is_active": dietitian.is_active,
            "title": dietitian.title,
            "specialization": dietitian.specialization,
            "experience_years": dietitian.experience_years,
            "bio": dietitian.bio,
        }
    }

@router.post("/create-dietitian")
async def create_dietitian(
    data: DietitianCreate,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Yeni diyetisyen hesabı oluşturur."""
    # Mevcut aktif diyetisyen var mı kontrol et
    existing_active = await Dietitian.find_one(Dietitian.is_active == True)
    if existing_active:
        raise HTTPException(
            status_code=400,
            detail="Sistemde zaten aktif bir diyetisyen var. Önce mevcut diyetisyeni pasifleştirin."
        )
    
    # E-posta benzersizliğini kontrol et
    existing_email = await Dietitian.find_one(Dietitian.email == data.email)
    if not existing_email:
        existing_email = await Member.find_one(Member.email == data.email)
    if not existing_email:
        existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor")
    
    # Diyetisyen oluştur
    hashed_password = security.get_password_hash(data.password)
    dietitian = Dietitian(
        email=data.email,
        hashed_password=hashed_password,
        full_name=data.full_name,
        role=UserRole.DIETITIAN,
        is_active=True,
        title=data.title,
        specialization=data.specialization,
        experience_years=data.experience_years,
        bio=data.bio,
    )
    await dietitian.create()
    
    return {
        "message": "Diyetisyen hesabı başarıyla oluşturuldu",
        "dietitian": {
            "id": str(dietitian.id),
            "email": dietitian.email,
            "full_name": dietitian.full_name,
            "role": dietitian.role.value,
            "is_active": dietitian.is_active,
            "title": dietitian.title,
            "specialization": dietitian.specialization,
            "experience_years": dietitian.experience_years,
            "bio": dietitian.bio,
        }
    }

@router.put("/dietitian/{dietitian_id}")
async def update_dietitian(
    dietitian_id: str,
    data: DietitianCreate,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Diyetisyen bilgilerini günceller."""
    dietitian = await Dietitian.get(dietitian_id)
    if not dietitian:
        raise HTTPException(status_code=404, detail="Diyetisyen bulunamadı")
    
    # E-posta değiştiyse benzersizliği kontrol et
    if data.email != dietitian.email:
        existing = await Dietitian.find_one(Dietitian.email == data.email)
        if not existing:
            existing = await Member.find_one(Member.email == data.email)
        if not existing:
            existing = await User.find_one(User.email == data.email)
        if existing and str(existing.id) != dietitian_id:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kullanılıyor")
        dietitian.email = data.email
    
    dietitian.full_name = data.full_name
    dietitian.title = data.title
    dietitian.specialization = data.specialization
    dietitian.experience_years = data.experience_years
    dietitian.bio = data.bio
    
    # Şifre belirtilmişse güncelle
    if data.password:
        dietitian.hashed_password = security.get_password_hash(data.password)
        dietitian.password_changed_at = datetime.utcnow()
    
    await dietitian.save()
    
    return {
        "message": "Diyetisyen bilgileri güncellendi",
        "dietitian": {
            "id": str(dietitian.id),
            "email": dietitian.email,
            "full_name": dietitian.full_name,
            "role": dietitian.role.value if hasattr(dietitian.role, 'value') else dietitian.role,
            "is_active": dietitian.is_active,
            "title": dietitian.title,
            "specialization": dietitian.specialization,
            "experience_years": dietitian.experience_years,
            "bio": dietitian.bio,
        }
    }

@router.put("/dietitian/{dietitian_id}/toggle-active")
async def toggle_dietitian_active(
    dietitian_id: str,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Diyetisyenin aktiflik durumunu değiştirir."""
    dietitian = await Dietitian.get(dietitian_id)
    if not dietitian:
        raise HTTPException(status_code=404, detail="Diyetisyen bulunamadı")
    
    dietitian.is_active = not dietitian.is_active
    await dietitian.save()
    
    return {
        "message": f"Diyetisyen {'aktifleştirildi' if dietitian.is_active else 'pasifleştirildi'}",
        "is_active": dietitian.is_active,
    }

@router.delete("/dietitian/{dietitian_id}")
async def delete_dietitian(
    dietitian_id: str,
    current_user: User = Depends(get_admin_user)
) -> Any:
    """Diyetisyen hesabını siler."""
    dietitian = await Dietitian.get(dietitian_id)
    if not dietitian:
        raise HTTPException(status_code=404, detail="Diyetisyen bulunamadı")
    
    await dietitian.delete()
    

    return {"message": "Diyetisyen hesabı silindi"}
