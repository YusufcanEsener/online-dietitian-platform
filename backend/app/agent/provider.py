import asyncio
import json

from openai import AsyncOpenAI

from app.agent.schemas import AIInsight, AnalysisStatus, MemberAnalysisContext, RiskLevel, RuleEngineResult
from app.core.config import settings

_OPENAI_TIMEOUT_SECONDS = 30


def build_rule_based_message(rule_result: RuleEngineResult) -> AIInsight:
    """AI kapaliysa veya hata verirse kullanilan guvenli fallback."""
    if rule_result.status == AnalysisStatus.INSUFFICIENT_DATA:
        return AIInsight(
            summary="Yeterli veri olmadigi icin analiz rule engine ile sinirli kaldi.",
            recommendation="Uyeden duzenli gunluk log girmesi istenmeli; veri gelene kadar sonuc INSUFFICIENT_DATA olarak izlenmeli.",
        )

    if rule_result.risk_level == RiskLevel.CRITICAL:
        recommendation = "Diyetisyen ayni gun icinde uyeyle iletisime gecmeli ve plan ile log disiplinini hizla kontrol etmeli."
    elif rule_result.risk_level == RiskLevel.HIGH:
        recommendation = "Kisa vadede takip aksiyonu alinmali; uye ile iletisime gecilip log ve plan uyumu netlestirilmeli."
    elif rule_result.risk_level == RiskLevel.MEDIUM:
        recommendation = "Uye bir sonraki takipte onceliklendirilmeli ve plan ile log sureci gozden gecirilmeli."
    else:
        recommendation = "Mevcut duzen korunabilir; rutin takip yeterli."

    return AIInsight(
        summary=rule_result.summary,
        recommendation=recommendation,
    )


class OpenAIAnalysisProvider:
    def __init__(self) -> None:
        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

    @property
    def enabled(self) -> bool:
        return self._client is not None

    async def generate_analysis(
        self,
        context: MemberAnalysisContext,
        rule_result: RuleEngineResult,
    ) -> AIInsight:
        if not self.enabled:
            raise RuntimeError("OPENAI_DISABLED")

        compact_payload = {
            "risk_level": rule_result.risk_level.value,
            "summary": rule_result.summary,
            "days_since_last_log": rule_result.metrics.days_since_last_log,
            "calorie_adherence": rule_result.metrics.calorie_adherence,
            "has_plan": rule_result.metrics.has_plan,
        }

        async with asyncio.timeout(_OPENAI_TIMEOUT_SECONDS):
            response = await self._client.responses.create(
                model=settings.OPENAI_AGENT_MODEL,
                input=(
                    "Sen bir diyetisyen asistanisin.\n"
                    "Gorevin: verilen risk ve metriklere gore kisa analiz yap.\n"
                    "Kurallar:\n"
                    "- Asla veri uydurma\n"
                    "- Kisa yaz (max 2 cumle)\n"
                    "- Klinik ve net ol\n"
                    "- Sadece JSON don\n\n"
                    f"Veri: {json.dumps(compact_payload)}"
                ),
                text={"format": {"type": "json_object"}},
                max_output_tokens=220,
            )

        try:
            payload = json.loads(response.output_text)
        except Exception:
            return build_rule_based_message(rule_result)

        summary = payload.get("summary")
        if not summary or len(summary) < 5:
            summary = rule_result.summary

        return AIInsight(
            summary=summary,
            recommendation=payload.get("recommendation") or build_rule_based_message(rule_result).recommendation,
        )
