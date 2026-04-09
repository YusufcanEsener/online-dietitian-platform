from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import Dietitian, User, Member
from app.schemas.user import DietitianResponse, DietitianUpdate, UserResponse
from app.api.api_v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=DietitianResponse)
async def read_dietitian_me(current_user: User = Depends(get_current_user)) -> Any:
    """Mevcut diyetisyenin bilgilerini döndürür."""
    if not isinstance(current_user, Dietitian):
        raise HTTPException(status_code=400, detail="Not a dietitian")
    
    return DietitianResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        title=current_user.title,
        specialization=current_user.specialization,
        experience_years=current_user.experience_years,
        bio=current_user.bio
    )

@router.get("/me/clients", response_model=List[UserResponse])
async def get_my_clients(current_user: User = Depends(get_current_user)) -> Any:
    """Tüm üye listesini döndürür (tek diyetisyen modeli — tüm üyeler bu diyetisyene ait)."""
    if not isinstance(current_user, Dietitian):
        raise HTTPException(status_code=400, detail="Not a dietitian")
    
    # Tek diyetisyen modeli: tüm aktif üyeleri döndür
    members = await Member.find(Member.is_active == True).to_list()
    return [
        UserResponse(
            id=str(m.id),
            email=m.email,
            full_name=m.full_name,
            role=m.role,
            is_active=m.is_active
        ) for m in members
    ]

@router.put("/me", response_model=DietitianResponse)
async def update_dietitian_me(
    item_in: DietitianUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Diyetisyen profilini günceller."""
    if not isinstance(current_user, Dietitian):
        raise HTTPException(status_code=400, detail="Not a dietitian")
    
    dietitian = await Dietitian.get(current_user.id)
    
    if item_in.title is not None:
        dietitian.title = item_in.title
    if item_in.specialization is not None:
        dietitian.specialization = item_in.specialization
    if item_in.experience_years is not None:
        dietitian.experience_years = item_in.experience_years
    if item_in.bio is not None:
        dietitian.bio = item_in.bio
        
    await dietitian.save()
    
    return DietitianResponse(
        id=str(dietitian.id),
        email=dietitian.email,
        full_name=dietitian.full_name,
        role=dietitian.role,
        is_active=dietitian.is_active,
        title=dietitian.title,
        specialization=dietitian.specialization,
        experience_years=dietitian.experience_years,
        bio=dietitian.bio
    )
