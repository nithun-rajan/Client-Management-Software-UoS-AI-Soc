"""
Health Check Endpoints

Provides comprehensive health and readiness checks for the application.
Includes database connectivity, dependency checks, and SLO metrics.
"""

import os
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import psutil
from fastapi import Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import engine

# Track application start time for uptime calculation
_app_start_time = time.time()


class HealthStatus:
    """Health check status constants."""

    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class HealthCheck:
    """Health check implementation."""

    @staticmethod
    def get_uptime() -> float:
        """Get application uptime in seconds."""
        return time.time() - _app_start_time

    @staticmethod
    def check_database() -> Dict[str, Any]:
        """
        Check database connectivity and performance.

        Returns:
            Dict with status, latency, and connection pool info
        """
        start_time = time.time()
        status = HealthStatus.HEALTHY
        error = None

        try:
            # Test database connectivity with simple query
            with engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                result.fetchone()

            latency_ms = (time.time() - start_time) * 1000

            # Check connection pool status
            pool = engine.pool
            pool_status = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
            }

            # Determine health based on latency
            if latency_ms > 1000:  # 1 second
                status = HealthStatus.DEGRADED
            elif latency_ms > 5000:  # 5 seconds
                status = HealthStatus.UNHEALTHY

        except Exception as e:
            status = HealthStatus.UNHEALTHY
            error = str(e)
            latency_ms = (time.time() - start_time) * 1000
            pool_status = {}

        return {
            "status": status,
            "latency_ms": round(latency_ms, 2),
            "pool": pool_status,
            "error": error,
        }

    @staticmethod
    def get_system_metrics() -> Dict[str, Any]:
        """
        Get system resource metrics.

        Returns:
            Dict with CPU, memory, and disk metrics
        """
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.1)

            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_mb = memory.available / (1024 * 1024)

            # Disk usage
            disk = psutil.disk_usage("/")
            disk_percent = disk.percent

            return {
                "cpu_percent": round(cpu_percent, 2),
                "memory_percent": round(memory_percent, 2),
                "memory_available_mb": round(memory_available_mb, 2),
                "disk_percent": round(disk_percent, 2),
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_slo_metrics() -> Dict[str, Any]:
        """
        Get SLO (Service Level Objective) metrics.

        This would typically pull from Prometheus or a metrics store.
        For now, returns placeholder values.
        """
        # In production, fetch from Prometheus:
        # - Uptime percentage (last 30 days)
        # - P95 latency
        # - Error rate
        # - Error budget remaining

        return {
            "uptime_target": float(os.getenv("SLO_UPTIME_TARGET", "0.999")),
            "latency_p95_target_ms": int(os.getenv("SLO_LATENCY_P95_MS", "500")),
            "error_rate_target": float(os.getenv("SLO_ERROR_RATE_TARGET", "0.001")),
            # Actual values would come from metrics aggregation
            "note": "Actual SLO metrics available via /metrics endpoint",
        }

    @classmethod
    def get_error_budget_summary(cls) -> Dict[str, Any]:
        """
        Get error budget summary for health check.

        Returns:
            Dict with error budget status and warnings
        """
        try:
            from app.observability.error_budget import get_error_budget_calculator

            calculator = get_error_budget_calculator()

            # Get example metrics (in production, these would come from Prometheus)
            # Using conservative estimates for health check
            metrics = {
                "API Availability": 0.9995,  # 99.95%
                "API Latency P95": 0.450,    # 450ms
                "Error Rate": 0.0005,        # 0.05%
            }

            budgets = calculator.get_error_budget_summary(metrics)

            # Determine worst budget status
            worst_status = "healthy"
            min_remaining_pct = 100.0
            critical_budgets = []

            for budget in budgets:
                if budget.budget_remaining_pct < min_remaining_pct:
                    min_remaining_pct = budget.budget_remaining_pct

                if budget.status == "critical":
                    worst_status = "critical"
                    critical_budgets.append(budget.slo_name)
                elif budget.status == "warning" and worst_status != "critical":
                    worst_status = "warning"

            # Generate warnings
            warnings = []
            if worst_status == "critical":
                # FR-056: Log critical alerts when error budget is exhausted
                import logging
                logger = logging.getLogger(__name__)
                logger.critical(
                    f"CRITICAL: Error budget critically low ({min_remaining_pct:.1f}% remaining)",
                    extra={
                        "error_budget_remaining_pct": min_remaining_pct,
                        "affected_slos": critical_budgets,
                        "status": "critical",
                        "action": "Halt non-critical deployments"
                    }
                )
                warnings.append(
                    f"CRITICAL: Error budget critically low ({min_remaining_pct:.1f}% remaining)"
                )
                warnings.append(f"Affected SLOs: {', '.join(critical_budgets)}")
                warnings.append("Action: Halt non-critical deployments")
            elif worst_status == "warning":
                # FR-055: Log warnings when error budget is 50% consumed
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(
                    f"WARNING: Error budget below 50% ({min_remaining_pct:.1f}% remaining)",
                    extra={
                        "error_budget_remaining_pct": min_remaining_pct,
                        "status": "warning",
                        "action": "Reduce release frequency, increase testing"
                    }
                )
                warnings.append(
                    f"WARNING: Error budget below 50% ({min_remaining_pct:.1f}% remaining)"
                )
                warnings.append("Action: Reduce release frequency, increase testing")

            return {
                "status": worst_status,
                "remaining_pct": round(min_remaining_pct, 1),
                "warnings": warnings,
                "details_url": "/error-budget"
            }

        except Exception as e:
            # If error budget calculation fails, return safe default
            return {
                "status": "unknown",
                "remaining_pct": None,
                "warnings": [f"Error budget calculation unavailable: {str(e)}"],
                "details_url": "/error-budget"
            }

    @classmethod
    def get_comprehensive_health(cls, include_details: bool = True) -> Dict[str, Any]:
        """
        Get comprehensive health check results.

        Args:
            include_details: Whether to include detailed system metrics

        Returns:
            Dict with overall status and component checks
        """
        # Check all components
        db_health = cls.check_database()

        # Get error budget summary (always included per FR-054)
        error_budget = cls.get_error_budget_summary()

        # Determine overall status
        if db_health["status"] == HealthStatus.UNHEALTHY:
            overall_status = HealthStatus.UNHEALTHY
        elif db_health["status"] == HealthStatus.DEGRADED:
            overall_status = HealthStatus.DEGRADED
        elif error_budget["status"] == "critical":
            # Error budget critical affects overall health
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.HEALTHY

        response = {
            "status": overall_status,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "uptime_seconds": round(cls.get_uptime(), 2),
            "version": "1.0.0",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "error_budget": error_budget,  # FR-054: Always include error budget
            "checks": {
                "database": db_health,
            },
        }

        if include_details:
            response["system"] = cls.get_system_metrics()
            response["slo"] = cls.get_slo_metrics()

        return response


def get_health_check() -> HealthCheck:
    """Get HealthCheck instance."""
    return HealthCheck()
