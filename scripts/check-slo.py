#!/usr/bin/env python3
"""
SLO Monitoring Script

Checks SLO compliance and error budget status.
Can be run manually or scheduled via cron.

Usage:
    python scripts/check-slo.py                    # Check all SLOs
    python scripts/check-slo.py --slo availability # Check specific SLO
    python scripts/check-slo.py --alert            # Send alerts if critical
    python scripts/check-slo.py --json             # Output JSON for automation
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.observability.error_budget import (
    ErrorBudgetCalculator,
    ErrorBudget,
    BurnRateLevel,
    SLOType,
)

# Color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


class SLOMonitor:
    """Monitor SLO compliance and error budget."""

    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        self.calculator = ErrorBudgetCalculator()

    def fetch_metrics(self) -> Dict[str, float]:
        """
        Fetch current metrics.

        In production, this would query Prometheus or your metrics backend.
        For now, returns example values.
        """
        # TODO: Replace with actual Prometheus queries
        # Example Prometheus queries:
        # - Availability: (sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m])))
        # - Latency P95: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
        # - Error Rate: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])))

        return {
            "API Availability": 0.9995,  # 99.95%
            "API Latency P95": 0.450,  # 450ms
            "Error Rate": 0.0005,  # 0.05%
        }

    def check_slo(self, slo_name: Optional[str] = None) -> List[ErrorBudget]:
        """Check SLO status."""
        metrics = self.fetch_metrics()

        if slo_name:
            # Filter to specific SLO
            slos = [slo for slo in self.calculator.get_default_slos() if slo.name == slo_name]
            if not slos:
                raise ValueError(f"SLO not found: {slo_name}")
        else:
            slos = self.calculator.get_default_slos()

        budgets = []
        for slo in slos:
            if slo.name in metrics:
                budget = self.calculator.calculate_error_budget(
                    slo_config=slo,
                    actual_value=metrics[slo.name],
                )
                budgets.append(budget)

        return budgets

    def print_status(self, budgets: List[ErrorBudget]):
        """Print status in human-readable format."""
        print(f"\n{Colors.BOLD}📊 SLO Status Report{Colors.END}")
        print(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")

        overall_healthy = all(b.status == "healthy" for b in budgets)
        overall_critical = any(b.status == "critical" for b in budgets)

        if overall_critical:
            status_icon = f"{Colors.RED}🔴{Colors.END}"
            status_text = f"{Colors.RED}CRITICAL{Colors.END}"
        elif not overall_healthy:
            status_icon = f"{Colors.YELLOW}🟡{Colors.END}"
            status_text = f"{Colors.YELLOW}WARNING{Colors.END}"
        else:
            status_icon = f"{Colors.GREEN}🟢{Colors.END}"
            status_text = f"{Colors.GREEN}HEALTHY{Colors.END}"

        print(f"Overall Status: {status_icon} {status_text}\n")

        for budget in budgets:
            self._print_budget(budget)

    def _print_budget(self, budget: ErrorBudget):
        """Print single budget status."""
        # Status icon
        if budget.status == "healthy":
            status_icon = f"{Colors.GREEN}✓{Colors.END}"
            status_color = Colors.GREEN
        elif budget.status == "warning":
            status_icon = f"{Colors.YELLOW}⚠{Colors.END}"
            status_color = Colors.YELLOW
        else:
            status_icon = f"{Colors.RED}✗{Colors.END}"
            status_color = Colors.RED

        print(f"{status_icon} {Colors.BOLD}{budget.slo_name}{Colors.END}")

        # Format target and actual
        if budget.slo_type == SLOType.LATENCY:
            target_str = f"{budget.target * 1000:.0f}ms"
            actual_str = f"{budget.actual * 1000:.1f}ms"
        else:
            target_str = f"{budget.target * 100:.2f}%"
            actual_str = f"{budget.actual * 100:.3f}%"

        print(f"  Target: {target_str} | Actual: {actual_str}")

        # Error budget
        print(f"  Budget Remaining: {status_color}{budget.budget_remaining_pct:.1f}%{Colors.END}")
        print(f"  Budget Consumed: {budget.budget_consumed * 100:.3f}%")

        # Burn rate
        burn_color = Colors.GREEN
        if budget.burn_rate_level == BurnRateLevel.CRITICAL:
            burn_color = Colors.RED
        elif budget.burn_rate_level == BurnRateLevel.HIGH:
            burn_color = Colors.YELLOW

        print(f"  Burn Rate: {burn_color}{budget.burn_rate:.2f}x{Colors.END} ({budget.burn_rate_level.value})")

        if budget.time_to_exhaustion_hours and budget.time_to_exhaustion_hours < float('inf'):
            tte_str = self.calculator.format_time_to_exhaustion(budget.time_to_exhaustion_hours)
            print(f"  Time to Exhaustion: {burn_color}{tte_str}{Colors.END}")

        print()

    def output_json(self, budgets: List[ErrorBudget]) -> str:
        """Output status as JSON."""
        data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "slos": [],
        }

        for budget in budgets:
            slo_data = {
                "name": budget.slo_name,
                "type": budget.slo_type.value,
                "status": budget.status,
                "target": budget.target,
                "actual": budget.actual,
                "budget_remaining_pct": round(budget.budget_remaining_pct, 2),
                "budget_consumed": round(budget.budget_consumed * 100, 3),
                "burn_rate": round(budget.burn_rate, 2),
                "burn_rate_level": budget.burn_rate_level.value,
                "time_to_exhaustion_hours": budget.time_to_exhaustion_hours,
            }
            data["slos"].append(slo_data)

        return json.dumps(data, indent=2)

    def should_alert(self, budgets: List[ErrorBudget]) -> bool:
        """Check if we should send alerts."""
        return any(
            budget.status == "critical" or
            budget.burn_rate_level in [BurnRateLevel.HIGH, BurnRateLevel.CRITICAL]
            for budget in budgets
        )

    def send_alert(self, budgets: List[ErrorBudget]):
        """Send alert notifications."""
        # In production, integrate with:
        # - Slack webhook
        # - PagerDuty
        # - Email
        # - Opsgenie

        critical_budgets = [b for b in budgets if b.status == "critical"]
        high_burn = [b for b in budgets if b.burn_rate_level in [BurnRateLevel.HIGH, BurnRateLevel.CRITICAL]]

        if critical_budgets or high_burn:
            print(f"\n{Colors.RED}{Colors.BOLD}🚨 ALERT: SLO Violation Detected{Colors.END}\n")

            if critical_budgets:
                print(f"{Colors.RED}Critical Budget Status:{Colors.END}")
                for budget in critical_budgets:
                    print(f"  - {budget.slo_name}: {budget.budget_remaining_pct:.1f}% remaining")

            if high_burn:
                print(f"\n{Colors.RED}High Burn Rate:{Colors.END}")
                for budget in high_burn:
                    tte = self.calculator.format_time_to_exhaustion(budget.time_to_exhaustion_hours)
                    print(f"  - {budget.slo_name}: {budget.burn_rate:.2f}x burn rate (exhaustion in {tte})")

            print(f"\n{Colors.YELLOW}Action Required:{Colors.END}")
            print("  1. Check /error-budget endpoint for details")
            print("  2. Review recent deployments and changes")
            print("  3. Check Prometheus alerts for related incidents")
            print("  4. Consider pausing deployments if budget critical")


def main():
    parser = argparse.ArgumentParser(
        description='Monitor SLO compliance and error budget',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/check-slo.py                      # Check all SLOs
  python scripts/check-slo.py --slo "API Availability"  # Check specific SLO
  python scripts/check-slo.py --alert              # Send alerts if critical
  python scripts/check-slo.py --json               # Output JSON
        """
    )
    parser.add_argument(
        '--slo',
        help='Check specific SLO (e.g., "API Availability")',
        default=None
    )
    parser.add_argument(
        '--alert',
        action='store_true',
        help='Send alerts if SLO critical'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output as JSON'
    )
    parser.add_argument(
        '--api-url',
        default='http://localhost:8000',
        help='API URL for health checks'
    )

    args = parser.parse_args()

    monitor = SLOMonitor(api_url=args.api_url)

    try:
        budgets = monitor.check_slo(slo_name=args.slo)

        if args.json:
            print(monitor.output_json(budgets))
        else:
            monitor.print_status(budgets)

        if args.alert and monitor.should_alert(budgets):
            monitor.send_alert(budgets)

        # Exit code based on worst status
        worst_status = max((b.status for b in budgets), key=lambda s: ["healthy", "warning", "critical"].index(s))
        if worst_status == "critical":
            sys.exit(2)
        elif worst_status == "warning":
            sys.exit(1)
        else:
            sys.exit(0)

    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}", file=sys.stderr)
        sys.exit(3)


if __name__ == '__main__':
    main()
