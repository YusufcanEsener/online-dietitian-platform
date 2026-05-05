from time import perf_counter

from app.agent.data_fetcher import fetch_member_data
from app.agent.provider import OpenAIAnalysisProvider, build_rule_based_message
from app.agent.rule_engine import evaluate_member_risk
from app.agent.schemas import (
    AnalysisSource,
    AnalysisStatus,
    AnalyzeMemberResponse,
    MemberAnalysisContext,
    RiskLevel,
)
from app.models.agent_log import AgentActionType, AgentLog

provider = OpenAIAnalysisProvider()


async def _save_agent_log(
    result: AnalyzeMemberResponse,
    *,
    batch_id: str | None,
    triggered_by: str,
    ai_error: str | None = None,
) -> None:
    details = {
        "risk_level": result.risk_level.value,
        "status": result.status.value,
        "source": result.source.value,
        "recommendation": result.recommendation,
        "findings": [finding.model_dump() for finding in result.findings],
        "metrics": result.metrics.model_dump(),
        "ai_used": result.ai_used,
        "fallback_used": result.fallback_used,
    }
    if ai_error:
        details["ai_error"] = ai_error

    log = AgentLog(
        action_type=AgentActionType.MEMBER_ANALYSIS,
        member_id=result.member_id,
        member_name=result.member_name,
        batch_id=batch_id,
        risk_level=result.risk_level.value,
        ai_used=result.ai_used,
        fallback_used=result.fallback_used,
        execution_time_ms=result.execution_time_ms,
        ai_error=result.ai_error or ai_error,
        details=details,
        reasoning=f"Risk: {result.risk_level.value} | Status: {result.status.value} | Summary: {result.analysis}",
        triggered_by=triggered_by,
        status="completed",
    )
    await log.insert()


async def analyze_single_member(
    member_id: str,
    *,
    triggered_by: str = "manual",
    batch_id: str | None = None,
) -> AnalyzeMemberResponse | None:
    """Veri cekme -> rule engine -> kosullu AI -> AgentLog akisidir."""
    started_at = perf_counter()
    context: MemberAnalysisContext | None = await fetch_member_data(member_id)
    if context is None:
        return None

    rule_result = evaluate_member_risk(context)
    ai_used = False
    fallback_used = False
    source = AnalysisSource.RULE_ENGINE
    insight = build_rule_based_message(rule_result)

    should_call_ai = (
        provider.enabled
        and rule_result.status != AnalysisStatus.INSUFFICIENT_DATA
        and rule_result.risk_level in {RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL}
        and rule_result.metrics.calorie_adherence is not None
    )

    ai_error: str | None = None
    if should_call_ai:
        try:
            insight = await provider.generate_analysis(context, rule_result)
            ai_used = True
            source = AnalysisSource.OPENAI
        except Exception as exc:
            ai_error = str(exc)
            insight = build_rule_based_message(rule_result)
            fallback_used = True
            source = AnalysisSource.FALLBACK

    result = AnalyzeMemberResponse(
        member_id=str(context.member.id),
        member_name=context.member.full_name,
        batch_id=batch_id,
        triggered_by=triggered_by,
        risk_level=RiskLevel.LOW if rule_result.status == AnalysisStatus.INSUFFICIENT_DATA else rule_result.risk_level,
        status=rule_result.status,
        analysis=insight.summary,
        recommendation=insight.recommendation,
        source=source,
        ai_used=ai_used,
        fallback_used=fallback_used,
        execution_time_ms=int((perf_counter() - started_at) * 1000),
        ai_error=ai_error,
        findings=rule_result.findings,
        metrics=rule_result.metrics,
    )

    await _save_agent_log(result, batch_id=batch_id, triggered_by=triggered_by, ai_error=ai_error)
    return result
