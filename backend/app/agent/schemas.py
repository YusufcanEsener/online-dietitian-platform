from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.daily_log import DailyLog
from app.models.nutrition_plan import NutritionPlan
from app.models.user import Member


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AnalysisStatus(str, Enum):
    READY = "READY"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"


class AnalysisSource(str, Enum):
    RULE_ENGINE = "RULE_ENGINE"
    OPENAI = "OPENAI"
    FALLBACK = "FALLBACK"


class RuleFinding(BaseModel):
    code: str
    risk_level: RiskLevel
    message: str


class MemberAnalysisMetrics(BaseModel):
    logs_count_14d: int = 0
    days_since_last_log: Optional[int] = None
    calorie_adherence: Optional[int] = None
    avg_calories: Optional[int] = None
    target_calories: Optional[int] = None
    has_plan: bool = False
    plan_expired: bool = False


class MemberAnalysisContext(BaseModel):
    # Beanie modellerini tipli sekilde tasimak icin izin verilir.
    model_config = ConfigDict(arbitrary_types_allowed=True)

    member: Member
    daily_logs: List[DailyLog] = Field(default_factory=list)
    plan: Optional[NutritionPlan] = None


class RuleEngineResult(BaseModel):
    risk_level: RiskLevel = RiskLevel.LOW
    status: AnalysisStatus = AnalysisStatus.READY
    findings: List[RuleFinding] = Field(default_factory=list)
    metrics: MemberAnalysisMetrics = Field(default_factory=MemberAnalysisMetrics)
    summary: str = "Belirgin bir risk bulunmadi."


class AIInsight(BaseModel):
    summary: str
    recommendation: str


class AnalyzeMemberResponse(BaseModel):
    success: bool = True
    member_id: str
    member_name: Optional[str] = None
    batch_id: Optional[str] = None
    triggered_by: str = "manual"
    risk_level: RiskLevel
    status: AnalysisStatus
    analysis: str
    recommendation: Optional[str] = None
    source: AnalysisSource
    ai_used: bool = False
    fallback_used: bool = False
    execution_time_ms: Optional[int] = None
    ai_error: Optional[str] = None
    findings: List[RuleFinding] = Field(default_factory=list)
    metrics: MemberAnalysisMetrics = Field(default_factory=MemberAnalysisMetrics)
    error: Optional[str] = None
