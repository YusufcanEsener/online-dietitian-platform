"""
n8n AI Service - Webhook üzerinden n8n'e istek gönderir
"""
import httpx
from typing import Optional, Dict, Any
from datetime import datetime, date


class N8NService:
    """n8n webhook'a istek gönderen servis"""
    
    def __init__(self, webhook_url: str = "http://localhost:5678/webhook/ai-analyze"):
        self.webhook_url = webhook_url
        self.timeout = 60.0  # AI yanıtı için uzun timeout
    
    async def analyze_member(self, member_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Üye verilerini n8n'e gönderip AI analizi al
        
        Args:
            member_data: Üye bilgileri (kilo, boy, hedef, planlar, loglar)
            
        Returns:
            AI'ın analiz ve öneri yanıtı
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.webhook_url,
                    json=member_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    # n8n'den gelen yanıtı parse et
                    try:
                        json_response = response.json()
                        # n8n yanıtı array veya object olabilir
                        if isinstance(json_response, list) and len(json_response) > 0:
                            # İlk elemanı al
                            first_item = json_response[0]
                            if isinstance(first_item, dict) and "text" in first_item:
                                analysis_text = first_item["text"]
                            else:
                                analysis_text = str(first_item)
                        elif isinstance(json_response, dict):
                            if "text" in json_response:
                                analysis_text = json_response["text"]
                            elif "output" in json_response:
                                analysis_text = json_response["output"]
                            else:
                                analysis_text = str(json_response)
                        else:
                            analysis_text = response.text
                    except:
                        analysis_text = response.text
                    
                    return {
                        "success": True,
                        "analysis": analysis_text,
                    }
                else:
                    return {
                        "success": False,
                        "error": f"n8n yanıt hatası: {response.status_code}",
                        "details": response.text
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "AI yanıt süresi aşıldı. Lütfen tekrar deneyin."
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Beklenmeyen hata: {str(e)}"
            }
    
    def prepare_member_context(
        self,
        member: Dict[str, Any],
        active_plan: Optional[Dict[str, Any]] = None,
        daily_logs: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Üye verilerini AI için context formatına dönüştür
        """
        # Yaş hesapla
        age = None
        if member.get("birth_date"):
            try:
                birth = datetime.strptime(str(member["birth_date"]), "%Y-%m-%d").date()
                today = date.today()
                age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
            except:
                pass
        
        # BMI hesapla
        bmi = None
        if member.get("weight") and member.get("height"):
            height_m = member["height"] / 100
            bmi = round(member["weight"] / (height_m ** 2), 1)
        
        # Hedef kilo farkı
        weight_diff = None
        if member.get("weight") and member.get("target_weight"):
            weight_diff = member["weight"] - member["target_weight"]
        
        context = {
            "member_info": {
                "name": member.get("full_name", "Danışan"),
                "age": age,
                "gender": member.get("gender"),
                "current_weight": member.get("weight"),
                "height": member.get("height"),
                "target_weight": member.get("target_weight"),
                "weight_to_lose": weight_diff,
                "bmi": bmi,
                "activity_level": member.get("activity_level"),
            },
            "current_plan": None,
            "recent_progress": None,
            "request_type": "full_analysis"
        }
        
        # Aktif plan varsa ekle
        if active_plan:
            context["current_plan"] = {
                "title": active_plan.get("title"),
                "daily_calories": active_plan.get("daily_targets", {}).get("calories"),
                "protein": active_plan.get("daily_targets", {}).get("protein"),
                "carbs": active_plan.get("daily_targets", {}).get("carbs"),
                "fat": active_plan.get("daily_targets", {}).get("fat"),
                "water": active_plan.get("daily_targets", {}).get("water"),
            }
        
        # Son logları ekle (ortalama hesabı için)
        if daily_logs and len(daily_logs) > 0:
            total_calories = sum(log.get("calories_consumed", 0) for log in daily_logs)
            avg_calories = round(total_calories / len(daily_logs)) if daily_logs else 0
            
            context["recent_progress"] = {
                "days_tracked": len(daily_logs),
                "avg_daily_calories": avg_calories,
            }
        
        return context
    
    # ==================== YENİ N8N WEBHOOK METODLARI ====================
    
    async def weekly_progress(self, member_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Haftalık gelişim analizi için n8n'e istek gönder
        
        Args:
            member_data: Üye ve haftalık log bilgileri
            
        Returns:
            AI'ın skor ve öneriler içeren yanıtı
        """
        webhook_url = "http://localhost:5678/webhook/ai-weekly-progress"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    webhook_url,
                    json=member_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    try:
                        json_response = response.json()
                        # n8n yanıtını parse et
                        if isinstance(json_response, list) and len(json_response) > 0:
                            result = json_response[0]
                        else:
                            result = json_response
                        
                        return {
                            "success": True,
                            "data": result
                        }
                    except:
                        return {
                            "success": False,
                            "error": "n8n yanıtı parse edilemedi"
                        }
                else:
                    return {
                        "success": False,
                        "error": f"n8n yanıt hatası: {response.status_code}"
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "AI yanıt süresi aşıldı"
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Beklenmeyen hata: {str(e)}"
            }
    
    async def daily_report(self, members_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Günlük toplu danışan raporu için n8n'e istek gönder
        
        Args:
            members_data: Tüm danışanların verileri
            
        Returns:
            AI'ın önceliklendirilmiş rapor yanıtı
        """
        webhook_url = "http://localhost:5678/webhook/ai-daily-report"
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:  # Toplu işlem için daha uzun timeout
                response = await client.post(
                    webhook_url,
                    json=members_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    try:
                        json_response = response.json()
                        if isinstance(json_response, list) and len(json_response) > 0:
                            result = json_response[0]
                        else:
                            result = json_response
                        
                        # n8n yanıtı "text" içinde JSON string olarak gelebilir
                        if isinstance(result, dict) and "text" in result:
                            text_content = result["text"]
                            # JSON parse etmeye çalış
                            import json
                            import re
                            cleaned = text_content.strip()
                            if cleaned.startswith("```"):
                                cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
                                cleaned = re.sub(r'\n?```\s*$', '', cleaned)
                            try:
                                result = json.loads(cleaned)
                            except json.JSONDecodeError:
                                # Parse edilemezse text olarak dön
                                pass
                        
                        return {
                            "success": True,
                            "data": result
                        }
                    except:
                        return {
                            "success": False,
                            "error": "n8n yanıtı parse edilemedi"
                        }
                else:
                    return {
                        "success": False,
                        "error": f"n8n yanıt hatası: {response.status_code}"
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "AI yanıt süresi aşıldı (toplu rapor için daha fazla zaman gerekebilir)"
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Beklenmeyen hata: {str(e)}"
            }

    async def generate_nutrition_plan(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        AI ile beslenme programı oluştur
        
        Args:
            data: Hedef, kalori ve danışan bilgileri
            
        Returns:
            AI'ın oluşturduğu beslenme programı (daily_targets, meals)
        """
        webhook_url = "http://localhost:5678/webhook/ai-generate-plan"
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    webhook_url,
                    json=data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    try:
                        import json as json_lib
                        import re
                        
                        raw_text = response.text
                        print(f"[n8n generate-plan] RAW RESPONSE: {raw_text[:1000]}")
                        
                        json_response = response.json()
                        
                        # Adım 1: Liste sarmasını aç [{"json": {...}}, ...]  →  {"json": {...}}
                        if isinstance(json_response, list) and len(json_response) > 0:
                            result = json_response[0]
                        else:
                            result = json_response
                        
                        print(f"[n8n generate-plan] after list unwrap, keys: {list(result.keys()) if isinstance(result, dict) else type(result).__name__}")
                        
                        # Adım 2: n8n "json" sarmasını aç: {"json": {...}}  →  {...}
                        if isinstance(result, dict) and "json" in result and "daily_targets" not in result:
                            result = result["json"]
                            print(f"[n8n generate-plan] unwrapped 'json' key, keys: {list(result.keys()) if isinstance(result, dict) else type(result).__name__}")
                        
                        # Adım 3: "text" veya "output" içinde JSON string varsa parse et
                        if isinstance(result, dict):
                            for key in ("text", "output"):
                                if key in result and isinstance(result[key], str):
                                    cleaned = result[key].strip()
                                    if cleaned.startswith("```"):
                                        cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
                                        cleaned = re.sub(r'\n?```\s*$', '', cleaned)
                                    try:
                                        parsed = json_lib.loads(cleaned)
                                        result = parsed
                                        print(f"[n8n generate-plan] parsed string from '{key}', keys: {list(result.keys()) if isinstance(result, dict) else type(result).__name__}")
                                    except json_lib.JSONDecodeError:
                                        pass
                                    break
                        
                        print(f"[n8n generate-plan] FINAL result keys: {list(result.keys()) if isinstance(result, dict) else type(result).__name__}")
                        
                        return {
                            "success": True,
                            "data": result
                        }
                    except Exception as parse_err:
                        print(f"[n8n generate-plan] PARSE ERROR: {parse_err}")
                        return {
                            "success": False,
                            "error": f"n8n yanıtı parse edilemedi: {str(parse_err)}"
                        }
                else:
                    return {
                        "success": False,
                        "error": f"n8n yanıt hatası: {response.status_code}"
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "AI yanıt süresi aşıldı. Lütfen tekrar deneyin."
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Beklenmeyen hata: {str(e)}"
            }

    async def trigger_agentic_webhook(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Agentic AI webhook'unu tetikle (Şimdi Güncelle butonu için)
        
        n8n'deki webhook3'ü tetikler ve sonucu döner
        """
        webhook_url = "http://localhost:5678/webhook/agentic-manual-trigger"
        
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(
                    webhook_url,
                    json=data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    try:
                        json_response = response.json()
                        if isinstance(json_response, list) and len(json_response) > 0:
                            result = json_response[0]
                        else:
                            result = json_response
                        
                        # n8n yanıtı "text" içinde olabilir
                        if isinstance(result, dict) and "text" in result:
                            text_content = result["text"]
                            import json as json_lib
                            import re
                            cleaned = text_content.strip()
                            if cleaned.startswith("```"):
                                cleaned = re.sub(r'^```(?:json)?\s*\n?', '', cleaned)
                                cleaned = re.sub(r'\n?```\s*$', '', cleaned)
                            try:
                                result = json_lib.loads(cleaned)
                            except:
                                pass
                        
                        return {
                            "success": True,
                            "data": result
                        }
                    except:
                        return {
                            "success": False,
                            "error": "n8n yanıtı parse edilemedi"
                        }
                else:
                    return {
                        "success": False,
                        "error": f"n8n yanıt hatası: {response.status_code}"
                    }
                    
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "n8n yanıt süresi aşıldı"
            }
        except httpx.ConnectError:
            return {
                "success": False,
                "error": "n8n'e bağlanılamadı. n8n'in çalıştığından emin olun."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Beklenmeyen hata: {str(e)}"
            }


# Singleton instance
n8n_service = N8NService()


