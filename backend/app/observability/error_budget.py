"""
Error Budget Tracking Module

Calculates and tracks error budgets based on SLO targets.

Error Budget = 1 - SLO Target
Example: For 99.9% uptime SLO, error budget is 0.1% (43.2 minutes/month)

Burn Rate = (Error Budget Used) / (Time Elapsed)
Fast burn rate indicates incidents consuming budget quickly.
"""

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Dict, List, Optional


class SLOType(str, Enum):
    """Types of SLO metrics."""

    AVAILABILITY = "availability"  # Uptime percentage
    LATENCY = "latency"  # Response time (P95, P99)
    ERROR_RATE = "error_rate"  # Error percentage


class BurnRateLevel(str, Enum):
    """Burn rate severity levels."""

    SAFE = "safe"  # < 1x (consuming budget slower than allocated)
    ELEVATED = "elevated"  # 1-2x (consuming budget at expected rate)
    HIGH = "high"  # 2-10x (consuming budget quickly)
    CRITICAL = "critical"  # > 10x (budget will be exhausted soon)


@dataclass
class SLOConfig:
    """SLO configuration."""

    name: str
    slo_type: SLOType
    target: float  # e.g., 0.999 for 99.9%
    window_days: int = 30  # Measurement window


@dataclass
class ErrorBudget:
    """Error budget calculation result."""

    slo_name: str
    slo_type: SLOType
    target: float
    actual: float
    budget_total: float  # Total error budget (1 - target)
    budget_remaining: float  # Remaining error budget
    budget_consumed: float  # Consumed error budget
    budget_remaining_pct: float  # Percentage of budget remaining
    window_start: datetime
    window_end: datetime
    window_days: int
    status: str  # "healthy", "warning", "critical"
    burn_rate: float  # Current burn rate
    burn_rate_level: BurnRateLevel
    time_to_exhaustion_hours: Optional[float] = None  # Hours until budget exhausted


class ErrorBudgetCalculator:
    """Calculate error budgets based on SLO metrics."""

    # Default SLO configurations
    DEFAULT_SLOS = [
        SLOConfig(
            name="API Availability",
            slo_type=SLOType.AVAILABILITY,
            target=float(os.getenv("SLO_UPTIME_TARGET", "0.999")),
            window_days=30,
        ),
        SLOConfig(
            name="API Latency P95",
            slo_type=SLOType.LATENCY,
            target=float(os.getenv("SLO_LATENCY_P95_MS", "500")) / 1000,  # Convert to seconds
            window_days=30,
        ),
        SLOConfig(
            name="Error Rate",
            slo_type=SLOType.ERROR_RATE,
            target=float(os.getenv("SLO_ERROR_RATE_TARGET", "0.001")),
            window_days=30,
        ),
    ]

    @staticmethod
    def calculate_error_budget(
        slo_config: SLOConfig,
        actual_value: float,
        window_start: Optional[datetime] = None,
        window_end: Optional[datetime] = None,
    ) -> ErrorBudget:
        """
        Calculate error budget for a given SLO.

        Args:
            slo_config: SLO configuration
            actual_value: Actual measured value (e.g., 0.9985 for 99.85% uptime)
            window_start: Start of measurement window (defaults to window_days ago)
            window_end: End of measurement window (defaults to now)

        Returns:
            ErrorBudget with all calculations
        """
        # Default window to configured days
        if window_end is None:
            window_end = datetime.now(timezone.utc)
        if window_start is None:
            window_start = window_end - timedelta(days=slo_config.window_days)

        # Calculate error budget
        budget_total = 1.0 - slo_config.target

        # For availability and error rate, higher actual is better
        # For latency, lower actual is better
        if slo_config.slo_type == SLOType.LATENCY:
            # Latency: budget consumed when actual > target
            budget_consumed = max(0.0, actual_value - slo_config.target)
            budget_consumed = min(budget_consumed / slo_config.target, budget_total)
        else:
            # Availability/Error Rate: budget consumed when actual < target
            budget_consumed = max(0.0, slo_config.target - actual_value)

        budget_remaining = max(0.0, budget_total - budget_consumed)
        budget_remaining_pct = (budget_remaining / budget_total * 100) if budget_total > 0 else 100.0

        # Calculate burn rate
        elapsed_days = (window_end - window_start).total_seconds() / 86400
        expected_consumption_rate = budget_total / slo_config.window_days
        actual_consumption_rate = budget_consumed / elapsed_days if elapsed_days > 0 else 0
        burn_rate = actual_consumption_rate / expected_consumption_rate if expected_consumption_rate > 0 else 0

        # Classify burn rate
        if burn_rate < 1.0:
            burn_rate_level = BurnRateLevel.SAFE
        elif burn_rate < 2.0:
            burn_rate_level = BurnRateLevel.ELEVATED
        elif burn_rate < 10.0:
            burn_rate_level = BurnRateLevel.HIGH
        else:
            burn_rate_level = BurnRateLevel.CRITICAL

        # Calculate time to exhaustion
        time_to_exhaustion_hours = None
        if burn_rate > 0 and budget_remaining > 0:
            days_to_exhaustion = budget_remaining / actual_consumption_rate if actual_consumption_rate > 0 else float('inf')
            time_to_exhaustion_hours = days_to_exhaustion * 24

        # Determine status
        if budget_remaining_pct >= 50:
            status = "healthy"
        elif budget_remaining_pct >= 20:
            status = "warning"
        else:
            status = "critical"

        return ErrorBudget(
            slo_name=slo_config.name,
            slo_type=slo_config.slo_type,
            target=slo_config.target,
            actual=actual_value,
            budget_total=budget_total,
            budget_remaining=budget_remaining,
            budget_consumed=budget_consumed,
            budget_remaining_pct=budget_remaining_pct,
            window_start=window_start,
            window_end=window_end,
            window_days=slo_config.window_days,
            status=status,
            burn_rate=burn_rate,
            burn_rate_level=burn_rate_level,
            time_to_exhaustion_hours=time_to_exhaustion_hours,
        )

    @staticmethod
    def format_time_to_exhaustion(hours: Optional[float]) -> str:
        """Format time to exhaustion in human-readable format."""
        if hours is None or hours == float('inf'):
            return "N/A (budget healthy)"

        if hours < 1:
            return f"{int(hours * 60)} minutes"
        elif hours < 24:
            return f"{hours:.1f} hours"
        else:
            days = hours / 24
            return f"{days:.1f} days"

    @staticmethod
    def calculate_allowed_downtime(slo_target: float, window_days: int = 30) -> Dict[str, float]:
        """
        Calculate allowed downtime for a given SLO target.

        Args:
            slo_target: SLO target (e.g., 0.999 for 99.9%)
            window_days: Measurement window in days

        Returns:
            Dict with downtime in various units
        """
        error_budget = 1.0 - slo_target
        window_seconds = window_days * 86400

        allowed_downtime_seconds = window_seconds * error_budget

        return {
            "seconds": allowed_downtime_seconds,
            "minutes": allowed_downtime_seconds / 60,
            "hours": allowed_downtime_seconds / 3600,
            "days": allowed_downtime_seconds / 86400,
            "percentage": error_budget * 100,
        }

    @classmethod
    def get_default_slos(cls) -> List[SLOConfig]:
        """Get default SLO configurations from environment."""
        return cls.DEFAULT_SLOS

    @classmethod
    def get_error_budget_summary(
        cls,
        metrics: Dict[str, float],
        window_start: Optional[datetime] = None,
        window_end: Optional[datetime] = None,
    ) -> List[ErrorBudget]:
        """
        Calculate error budgets for all default SLOs.

        Args:
            metrics: Dict mapping SLO names to actual values
            window_start: Start of measurement window
            window_end: End of measurement window

        Returns:
            List of ErrorBudget calculations
        """
        slos = cls.get_default_slos()
        budgets = []

        for slo in slos:
            if slo.name in metrics:
                budget = cls.calculate_error_budget(
                    slo_config=slo,
                    actual_value=metrics[slo.name],
                    window_start=window_start,
                    window_end=window_end,
                )
                budgets.append(budget)

        return budgets


def get_error_budget_calculator() -> ErrorBudgetCalculator:
    """Get ErrorBudgetCalculator instance."""
    return ErrorBudgetCalculator()
