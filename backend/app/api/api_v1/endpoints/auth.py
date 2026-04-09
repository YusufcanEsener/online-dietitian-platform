from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from app.core import security
from app.core.config import settings
from app.models.user import User, Dietitian, Member, UserRole
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserResponse, DietitianResponse
from jose import jwt, JWTError
from pydantic import ValidationError, BaseModel

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Doğrulanmış kullanıcıyı döndürür."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception
    
    # Önce Dietitian olarak dene
    user = await Dietitian.get(user_id)
    if user:
        return user
    
    # Sonra Member olarak dene
    user = await Member.get(user_id)
    if user:
        return user
    
    # Son olarak base User olarak dene
    user = await User.get(user_id)
    if not user:
        raise credentials_exception
    return user

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """Kullanıcı girişi ve JWT token döndürme."""
    # Tüm user tiplerinde ara
    user = await User.find_one(User.email == form_data.username)
    if not user:
        user = await Dietitian.find_one(Dietitian.email == form_data.username)
    if not user:
        user = await Member.find_one(Member.email == form_data.username)
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)) -> Any:
    """Mevcut kullanıcı bilgilerini döndürür."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )

@router.get("/me/full")
async def read_users_me_full(current_user: User = Depends(get_current_user)) -> Any:
    """Mevcut kullanıcının tam bilgilerini döndürür (role bazlı)."""
    base_data = {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "is_active": current_user.is_active,
        "password_changed_at": current_user.password_changed_at.isoformat() if current_user.password_changed_at else None,
    }
    
    if isinstance(current_user, Dietitian):
        base_data.update({
            "title": current_user.title,
            "specialization": current_user.specialization,
            "experience_years": current_user.experience_years,
            "bio": current_user.bio,
        })
    elif isinstance(current_user, Member):
        base_data.update({
            "subscription_status": current_user.subscription_status,
        })
    
    return base_data

# Password Change Schema
from datetime import datetime

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/change-password")
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Kullanıcının kendi şifresini değiştirmesi."""
    # Mevcut şifreyi doğrula
    if not security.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
    
    # Yeni şifreyi hashle ve kaydet
    current_user.hashed_password = security.get_password_hash(request.new_password)
    current_user.password_changed_at = datetime.utcnow()
    await current_user.save()
    
    return {
        "message": "Şifre başarıyla değiştirildi",
        "password_changed_at": current_user.password_changed_at.isoformat()
    }

@router.post("/register", response_model=UserResponse)
async def register_user(user_in: UserCreate) -> Any:
    """Yeni üye kaydı."""
    user = await User.find_one(User.email == user_in.email)
    if not user:
        user = await Member.find_one(Member.email == user_in.email)
    if not user:
        user = await Dietitian.find_one(Dietitian.email == user_in.email)
    
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    
    new_user = Member(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=UserRole.MEMBER
    )
    await new_user.create()
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role,
        is_active=new_user.is_active
    )




# Google OAuth Schema
from pydantic import BaseModel

class GoogleAuthRequest(BaseModel):
    token: str


@router.post("/google", response_model=Token)
async def google_auth(request: GoogleAuthRequest) -> Any:
    """
    Google OAuth ile giriş/kayıt.
    Google token'ı doğrulanır, kullanıcı varsa giriş yapar, yoksa yeni kullanıcı oluşturulur.
    """
    import requests
    
    # Google token'ı doğrula
    try:
        # Google'ın tokeninfo endpoint'ini kullan
        google_response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={request.token}"
        )
        
        if google_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Geçersiz Google token")
        
        google_data = google_response.json()
        
        # Client ID kontrolü (opsiyonel ama güvenlik için önerilir)
        if settings.GOOGLE_CLIENT_ID:
            if google_data.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise HTTPException(status_code=400, detail="Token bu uygulama için geçerli değil")
        
        email = google_data.get("email")
        full_name = google_data.get("name", email.split("@")[0])
        
        if not email:
            raise HTTPException(status_code=400, detail="Google hesabında e-posta bulunamadı")
        
    except requests.RequestException:
        raise HTTPException(status_code=400, detail="Google token doğrulaması başarısız")
    
    # Kullanıcıyı e-posta ile ara
    user = await Member.find_one(Member.email == email)
    if not user:
        user = await Dietitian.find_one(Dietitian.email == email)
    if not user:
        user = await User.find_one(User.email == email)
    
    # Kullanıcı yoksa yeni oluştur (sadece member olarak)
    if not user:
        # Rastgele şifre oluştur (kullanıcı Google ile giriş yapacağı için kullanılmayacak)
        import secrets
        random_password = secrets.token_urlsafe(32)
        hashed_password = security.get_password_hash(random_password)
        
        user = Member(
            email=email,
            hashed_password=hashed_password,
            full_name=full_name,
            role=UserRole.MEMBER,
            is_active=True
        )
        await user.create()
    
    # Kullanıcı aktif değilse hata ver
    if not user.is_active:
        if isinstance(user, Dietitian):
            raise HTTPException(status_code=400, detail="Diyetisyen hesabınız henüz onaylanmadı. Admin onayı bekleniyor.")
        raise HTTPException(status_code=400, detail="Hesabınız aktif değil")
    
    # Token oluştur
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


