from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import User, Member, Dietitian
from app.models.chat import Chat, Message
from app.schemas.chat import ChatResponse, MessageCreate, MessageResponse, ParticipantDetails
from app.api.api_v1.endpoints.auth import get_current_user
from app.api.api_v1.endpoints.members import get_the_dietitian
from pydantic import BaseModel

router = APIRouter()

class StartChatRequest(BaseModel):
    member_id: Optional[str] = None  # Diyetisyen için zorunlu

@router.post("/start", response_model=ChatResponse)
async def start_chat(
    body: Optional[StartChatRequest] = None,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Sohbet başlatır — üye için otomatik diyetisyen, diyetisyen için belirtilen üye."""
    
    if current_user.role == "member":
        # Üye: otomatik olarak tek diyetisyenle eşleştir
        dietitian = await get_the_dietitian()
        member_id = str(current_user.id)
        dietitian_id = str(dietitian.id)
        
        # Mevcut sohbet var mı?
        existing_chat = await Chat.find_one(Chat.member_id == member_id)
        if existing_chat:
            other_details = ParticipantDetails(
                name=dietitian.full_name or "Diyetisyen",
                title=dietitian.title
            )
            return ChatResponse(
                id=str(existing_chat.id),
                participants=existing_chat.participants,
                status=existing_chat.status,
                other_participant=other_details
            )
        
        # Yeni sohbet oluştur
        participants = sorted([member_id, dietitian_id])
        chat = Chat(
            participants=participants,
            member_id=member_id,
            dietitian_id=dietitian_id,
            status="active"
        )
        await chat.create()
        
        other_details = ParticipantDetails(
            name=dietitian.full_name or "Diyetisyen",
            title=dietitian.title
        )
        return ChatResponse(
            id=str(chat.id),
            participants=chat.participants,
            status=chat.status,
            other_participant=other_details
        )
    
    elif current_user.role == "dietitian":
        # Diyetisyen: belirtilen üyeyle sohbet başlat
        if not body or not body.member_id:
            raise HTTPException(status_code=400, detail="member_id gerekli")
        
        member = await Member.get(body.member_id)
        if not member:
            raise HTTPException(status_code=404, detail="Üye bulunamadı")
        
        member_id = str(member.id)
        dietitian_id = str(current_user.id)
        
        # Mevcut sohbet var mı?
        existing_chat = await Chat.find_one(Chat.member_id == member_id)
        if existing_chat:
            other_details = ParticipantDetails(
                name=member.full_name or "Üye"
            )
            return ChatResponse(
                id=str(existing_chat.id),
                participants=existing_chat.participants,
                status=existing_chat.status,
                other_participant=other_details
            )
        
        # Yeni sohbet oluştur
        participants = sorted([member_id, dietitian_id])
        chat = Chat(
            participants=participants,
            member_id=member_id,
            dietitian_id=dietitian_id,
            status="active"
        )
        await chat.create()
        
        other_details = ParticipantDetails(
            name=member.full_name or "Üye"
        )
        return ChatResponse(
            id=str(chat.id),
            participants=chat.participants,
            status=chat.status,
            other_participant=other_details
        )
    else:
        raise HTTPException(status_code=400, detail="Sadece üyeler ve diyetisyenler sohbet başlatabilir")

@router.get("/", response_model=List[ChatResponse])
async def get_chats(
    current_user: User = Depends(get_current_user)
) -> Any:
    """Kullanıcının sohbet listesini döndürür.
    Diyetisyen: TÜM üyeleri gösterir (sohbeti olmayanlar dahil).
    Üye: Sadece diyetisyen ile olan sohbeti gösterir.
    """
    if current_user.role == "dietitian":
        # Diyetisyen: tüm üyeleri listele (sohbet olsun olmasın)
        all_members = await Member.find(Member.is_active == True).to_list()
        response_chats = []
        
        for member in all_members:
            member_id = str(member.id)
            
            # Bu üyeyle mevcut sohbet var mı?
            existing_chat = await Chat.find_one(Chat.member_id == member_id)
            
            other_details = ParticipantDetails(
                name=member.full_name or "İsimsiz Üye"
            )
            
            if existing_chat:
                chat_resp = ChatResponse(
                    id=str(existing_chat.id),
                    participants=existing_chat.participants,
                    status=existing_chat.status,
                    other_participant=other_details
                )
                
                # Son mesajı ekle
                last_message = await Message.find(
                    Message.chat_id == str(existing_chat.id)
                ).sort("-timestamp").limit(1).to_list()
                
                if last_message:
                    m = last_message[0]
                    chat_resp.last_message = MessageResponse(
                        id=str(m.id),
                        sender_id=m.sender_id,
                        content=m.content,
                        timestamp=m.timestamp
                    )
            else:
                # Sohbeti olmayan üye — geçici ID olarak member_id kullan
                chat_resp = ChatResponse(
                    id=f"new_{member_id}",
                    participants=[member_id, str(current_user.id)],
                    status="active",
                    other_participant=other_details
                )
            
            response_chats.append(chat_resp)
        
        return response_chats
    
    else:
        # Üye: sadece diyetisyen ile olan sohbeti getir
        all_chats = await Chat.find(
            Chat.member_id == str(current_user.id)
        ).sort("-created_at").to_list()
        
        response_chats = []
        for c in all_chats:
            # Diyetisyeni bul
            other_user = await Dietitian.get(c.dietitian_id) if c.dietitian_id else None
            if not other_user:
                # Fallback: participants'dan bul
                other_id = next((pid for pid in c.participants if pid != str(current_user.id)), None)
                if other_id:
                    other_user = await Dietitian.get(other_id)
            
            other_details = None
            if other_user:
                other_details = ParticipantDetails(
                    name=other_user.full_name or "Diyetisyen",
                    title=getattr(other_user, "title", None)
                )
            else:
                other_details = ParticipantDetails(name="Diyetisyen")
            
            chat_resp = ChatResponse(
                id=str(c.id),
                participants=c.participants,
                status=getattr(c, "status", "active"),
                other_participant=other_details
            )
            
            # Son mesajı ekle
            last_message = await Message.find(
                Message.chat_id == str(c.id)
            ).sort("-timestamp").limit(1).to_list()
            
            if last_message:
                m = last_message[0]
                chat_resp.last_message = MessageResponse(
                    id=str(m.id),
                    sender_id=m.sender_id,
                    content=m.content,
                    timestamp=m.timestamp
                )
            response_chats.append(chat_resp)
        
        return response_chats

@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Belirli bir sohbetin bilgilerini döndürür."""
    chat = await Chat.get(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if str(current_user.id) not in chat.participants:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    # Son mesajı bul
    last_message = await Message.find(
        Message.chat_id == chat_id
    ).sort("-timestamp").limit(1).to_list()
    
    response = ChatResponse(id=str(chat.id), participants=chat.participants)
    if last_message:
        m = last_message[0]
        response.last_message = MessageResponse(
            id=str(m.id),
            sender_id=m.sender_id,
            content=m.content,
            timestamp=m.timestamp
        )
    
    return response

@router.post("/{chat_id}/messages", response_model=MessageResponse)
async def send_message(
    chat_id: str,
    message_in: MessageCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Sohbete yeni mesaj gönderir."""
    chat = await Chat.get(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if str(current_user.id) not in chat.participants:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    message = Message(
        chat_id=chat_id,
        sender_id=str(current_user.id),
        content=message_in.content
    )
    await message.create()
    return MessageResponse(
        id=str(message.id),
        sender_id=message.sender_id,
        content=message.content,
        timestamp=message.timestamp
    )

@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    chat_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
) -> Any:
    """Sohbetteki mesajları döndürür."""
    chat = await Chat.get(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if str(current_user.id) not in chat.participants:
        raise HTTPException(status_code=403, detail="Not a participant")
        
    messages = await Message.find(
        Message.chat_id == chat_id
    ).sort("+timestamp").skip(skip).limit(limit).to_list()
    
    return [
        MessageResponse(
            id=str(m.id),
            sender_id=m.sender_id,
            content=m.content,
            timestamp=m.timestamp
        ) for m in messages
    ]
