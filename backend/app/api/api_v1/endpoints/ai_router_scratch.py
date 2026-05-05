class GeneratePlanRequest(BaseModel):
    member_id: str
    goal: str  # weight_loss, muscle_gain, maintenance
    target_calories: int
    protein: int = None
    carbs: int = None
    fat: int = None
    menu_type: str = "daily"  # daily veya weekly
    medications: str = None
    allergies: str = None
    disliked_foods: str = None

class GeneratePlanResponse(BaseModel):
    success: bool
    daily_targets: dict = None
    meals: list = None
    error: str = None

@router.post("/generate-plan", response_model=GeneratePlanResponse)
async def generate_plan_with_ai(
    request: GeneratePlanRequest,
    current_user: Dietitian = Depends(get_dietitian_user)
) -> Any:
    """
    AI ile Beslenme Programi Olustur

    Hedef ve kalori bilgilerine gore AI beslenme programi onerir.
    Diyetisyen bu oneriyi duzenleyip kaydedebilir.
    """
    member_id = request.member_id

    # Uyeyi bul
    member = await Member.get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Uye bulunamadi")

    # Hedef etiketlerini Turkcelestir
    goal_labels = {
        "weight_loss": "Kilo Verme",
        "muscle_gain": "Kas Kazanimi",
        "maintenance": "Kilo Koruma"
    }
    goal_label = goal_labels.get(request.goal, request.goal)

    menu_type_label = "haftalik (7 gunluk)" if request.menu_type == "weekly" else "gunluk"
    
    macro_text = ""
    if request.protein or request.carbs or request.fat:
        macro_text = f"Makro Hedefleri: Protein {request.protein or '?'}g, Karbonhidrat {request.carbs or '?'}g, Yag {request.fat or '?'}g (Eksik olanlari sen hesapla)"
    else:
        macro_text = "Makro Hedefleri: (Kalori ve hedefe gore sen hesapla)"

    prompt = f"""Sen profesyonel bir diyetisyensin. Asagidaki bilgilere gore Turk mutfagina uygun bir {menu_type_label} beslenme programi olustur.
Hedef: {goal_label}
- weight_loss: Kilo vermek icin kalori acigi, yuksek protein
- muscle_gain: Kas kazanimi icin kalori fazlasi, cok yuksek protein
- maintenance: Mevcut kiloyu koruma

Gunluk Kalori Hedefi: {request.target_calories} kcal
{macro_text}

Danisan Bilgileri:
- Isim: {member.full_name or 'Bilinmiyor'}
- Mevcut Kilo: {member.weight or 'Bilinmiyor'} kg
- Hedef Kilo: {member.target_weight or 'Bilinmiyor'} kg
- Aktivite Seviyesi: {member.activity_level.value if member.activity_level else 'moderate'}
- Ilaclar/Alerjiler: {request.medications or 'Yok'}
- Sevmedigi Yiyecekler: {request.disliked_foods or 'Yok'}

Yanitini SADECE asagidaki JSON formatinda ver (baska aciklama ekleme):
{{
  "daily_targets": {{
    "calories": {request.target_calories},
    "protein": <gram cinsinden hesapla veya verilen degeri kullan>,
    "carbs": <gram cinsinden hesapla veya verilen degeri kullan>,
    "fat": <gram cinsinden hesapla veya verilen degeri kullan>,
    "water": <bardak sayisi 8-12 arasi>
  }},
  "meals": [
    {{
      "meal_type": "breakfast",
      "time": "08:00", 
      "notes": "Kahvalti onerisi",
      "foods": [
        {{ "name": "Yumurta", "amount": "2 adet" }},
        {{ "name": "Tam bugday ekmegi", "amount": "2 dilim" }}
      ]
    }},
    ...diger ogunler (snack, lunch, snack, dinner)
  ]
}}
NOT: Eger haftalik secilmis ise, meals listesini gunluk sekilde degil, genisletebilirsin veya her gun icin ayri ayri (toplam 35 ogun) donebilirsin. Ancak format ayni olmalidir.
"""

    import json
    from openai import AsyncOpenAI
    from app.core.config import settings
    
    if not settings.OPENAI_API_KEY:
        return GeneratePlanResponse(success=False, error="OPENAI_API_KEY bulunamadi")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_AGENT_MODEL or "gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful dietitian assistant that only outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.7,
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        return GeneratePlanResponse(
            success=True,
            daily_targets=data.get("daily_targets"),
            meals=data.get("meals", [])
        )
    except Exception as e:
        return GeneratePlanResponse(
            success=False,
            error=f"AI plan olusturulamadi: {str(e)}"
        )
