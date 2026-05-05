from datetime import date
from typing import Iterable, Optional

from app.agent.schemas import (
    AnalysisStatus,
    MemberAnalysisContext,
    MemberAnalysisMetrics,
    RiskLevel,
    RuleEngineResult,
    RuleFinding,
)


def _parse_log_date(log_date_value: str) -> Optional[date]:
    try:
        return date.fromisoformat(log_date_value)
    except (TypeError, ValueError):
        return None


def _risk_weight(level: RiskLevel) -> int:
    return {
        RiskLevel.LOW: 1,
        RiskLevel.MEDIUM: 2,
        RiskLevel.HIGH: 3,
        RiskLevel.CRITICAL: 4,
    }[level]


def _top_risk(findings: Iterable[RuleFinding]) -> RiskLevel:
    findings_list = list(findings)
    if not findings_list:
        return RiskLevel.LOW
    return max(findings_list, key=lambda item: _risk_weight(item.risk_level)).risk_level


def _build_metrics(context: MemberAnalysisContext) -> MemberAnalysisMetrics:
    today = date.today()
    plan = context.plan
    logs = context.daily_logs
    if logs:
        logs = sorted(logs, key=lambda item: item.log_date, reverse=True)

    last_log_date = _parse_log_date(logs[0].log_date) if logs else None
    days_since_last_log = (today - last_log_date).days if last_log_date else None

    target_calories = None
    if plan and plan.daily_targets:
        target_calories = plan.daily_targets.calories
    elif context.member.calculated_target_calories:
        target_calories = context.member.calculated_target_calories

    avg_calories = None
    calorie_adherence = None
    if logs:
        avg_calories = round(sum(log.calories_consumed for log in logs) / len(logs))
        if target_calories and target_calories > 0:
            adherence_value = 100 - abs(avg_calories - target_calories) / target_calories * 100
            calorie_adherence = max(0, min(100, round(adherence_value)))

    plan_expired = False
    has_plan = False
    if plan:
        has_plan = plan.is_active
        if plan.end_date and plan.end_date < today:
            plan_expired = True
            has_plan = False
        elif not plan.is_active:
            plan_expired = True

    return MemberAnalysisMetrics(
        logs_count_14d=len(logs),
        days_since_last_log=days_since_last_log,
        calorie_adherence=calorie_adherence,
        avg_calories=avg_calories,
        target_calories=target_calories,
        has_plan=has_plan,
        plan_expired=plan_expired,
    )


def evaluate_member_risk(context: MemberAnalysisContext) -> RuleEngineResult:
    """Rule engine her zaman calisir ve AI'dan bagimsiz karar uretir."""
    metrics = _build_metrics(context)
    findings: list[RuleFinding] = []
    status = AnalysisStatus.READY

    if metrics.logs_count_14d == 0:
        status = AnalysisStatus.INSUFFICIENT_DATA
        findings = [
            RuleFinding(
                code="NO_LOGS",
                risk_level=RiskLevel.LOW,
                message="Son 14 gunde gunluk log bulunmuyor.",
            )
        ]
        return RuleEngineResult(
            risk_level=RiskLevel.LOW,
            status=status,
            findings=findings,
            metrics=metrics,
            summary="Son 14 gunde gunluk log bulunmuyor.",
        )

    if metrics.days_since_last_log is not None:
        if metrics.days_since_last_log >= 7:
            findings.append(
                RuleFinding(
                    code="INACTIVE_7_DAYS",
                    risk_level=RiskLevel.HIGH,
                    message="Uye 7 gundur veya daha uzun suredir log girmiyor.",
                )
            )
        elif metrics.days_since_last_log >= 3:
            findings.append(
                RuleFinding(
                    code="INACTIVE_3_DAYS",
                    risk_level=RiskLevel.MEDIUM,
                    message="Uye son 3 gundur log girmiyor.",
                )
            )

    if metrics.calorie_adherence is not None and metrics.calorie_adherence < 50:
        findings.append(
            RuleFinding(
                code="LOW_CALORIE_ADHERENCE",
                risk_level=RiskLevel.HIGH,
                message="Kalori uyumu yuzde 50'nin altinda.",
            )
        )

    if not metrics.has_plan:
        findings.append(
            RuleFinding(
                code="PLAN_EXPIRED" if metrics.plan_expired else "NO_ACTIVE_PLAN",
                risk_level=RiskLevel.MEDIUM,
                message=(
                    "Uyenin aktif beslenme plani suresi dolmus."
                    if metrics.plan_expired
                    else "Uyenin aktif beslenme plani bulunmuyor."
                ),
            )
        )

    overall_risk = _top_risk(findings)
    high_findings = [finding for finding in findings if finding.risk_level == RiskLevel.HIGH]
    if metrics.days_since_last_log is not None and metrics.days_since_last_log >= 14:
        overall_risk = RiskLevel.CRITICAL
    elif len(high_findings) >= 2:
        overall_risk = RiskLevel.CRITICAL

    if not findings:
        findings.append(
            RuleFinding(
                code="STABLE",
                risk_level=RiskLevel.LOW,
                message="Belirgin risk saptanmadi.",
            )
        )
        overall_risk = RiskLevel.LOW

    findings = sorted(findings, key=lambda item: _risk_weight(item.risk_level), reverse=True)
    summary = " | ".join(finding.message for finding in findings[:3])

    return RuleEngineResult(
        risk_level=overall_risk,
        status=status,
        findings=findings,
        metrics=metrics,
        summary=summary,
    )
