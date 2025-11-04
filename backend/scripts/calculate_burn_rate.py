#!/usr/bin/env python3
"""
Burn Rate Calculator from Structured Logs (FR-053)

Parses structured JSON logs to calculate SLO metrics and burn rates.
This script provides log-based burn rate calculation to complement Prometheus metrics.

Usage:
    python scripts/calculate_burn_rate.py <log_file> [--window-hours HOURS] [--output json|text]

Example:
    # Calculate from last 24 hours of logs
    python scripts/calculate_burn_rate.py logs/app.log --window-hours 24

    # Calculate with JSON output for alerting
    python scripts/calculate_burn_rate.py logs/app.log --output json
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.observability.error_budget import (
    ErrorBudgetCalculator,
    SLOConfig,
    SLOType,
)


class LogMetricsCalculator:
    """Calculate SLO metrics from structured logs."""

    def __init__(self, window_hours: int = 24):
        """
        Initialize calculator.

        Args:
            window_hours: Time window for metric calculation
        """
        self.window_hours = window_hours
        self.window_start = datetime.now(timezone.utc) - timedelta(hours=window_hours)
        self.window_end = datetime.now(timezone.utc)

        # Collected metrics
        self.total_requests = 0
        self.successful_requests = 0
        self.error_requests = 0
        self.latencies: List[float] = []
        self.status_codes = defaultdict(int)

    def parse_log_file(self, log_file_path: str) -> None:
        """
        Parse structured JSON logs from file.

        Args:
            log_file_path: Path to log file containing JSON logs
        """
        try:
            with open(log_file_path, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue

                    try:
                        log_entry = json.loads(line)
                        self._process_log_entry(log_entry)
                    except json.JSONDecodeError:
                        print(f"Warning: Skipping invalid JSON at line {line_num}", file=sys.stderr)
                        continue

        except FileNotFoundError:
            print(f"Error: Log file not found: {log_file_path}", file=sys.stderr)
            sys.exit(1)
        except PermissionError:
            print(f"Error: Permission denied reading: {log_file_path}", file=sys.stderr)
            sys.exit(1)

    def _process_log_entry(self, log_entry: Dict) -> None:
        """
        Process a single log entry.

        Args:
            log_entry: Parsed JSON log entry
        """
        # Check if this is a request log (has status_code)
        if 'status_code' not in log_entry:
            return

        # Check if within time window
        timestamp_str = log_entry.get('timestamp')
        if timestamp_str:
            try:
                # Parse ISO timestamp
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                if timestamp < self.window_start or timestamp > self.window_end:
                    return  # Outside window
            except (ValueError, TypeError):
                pass  # Continue without timestamp filtering

        # Extract metrics
        status_code = log_entry.get('status_code')
        latency_ms = log_entry.get('latency_ms')

        if status_code is not None:
            self.total_requests += 1
            self.status_codes[status_code] += 1

            # 2xx and 3xx are successful
            if 200 <= status_code < 400:
                self.successful_requests += 1
            # 5xx are errors (4xx are client errors, don't count against SLO)
            elif status_code >= 500:
                self.error_requests += 1

        if latency_ms is not None:
            try:
                self.latencies.append(float(latency_ms))
            except (ValueError, TypeError):
                pass

    def calculate_availability(self) -> float:
        """
        Calculate availability from request success rate.

        Returns:
            Availability as decimal (e.g., 0.999 for 99.9%)
        """
        if self.total_requests == 0:
            return 1.0  # No requests = 100% available

        return self.successful_requests / self.total_requests

    def calculate_error_rate(self) -> float:
        """
        Calculate error rate from 5xx responses.

        Returns:
            Error rate as decimal (e.g., 0.001 for 0.1%)
        """
        if self.total_requests == 0:
            return 0.0

        return self.error_requests / self.total_requests

    def calculate_latency_p95(self) -> float:
        """
        Calculate P95 latency in seconds.

        Returns:
            P95 latency in seconds
        """
        if not self.latencies:
            return 0.0

        sorted_latencies = sorted(self.latencies)
        p95_index = int(len(sorted_latencies) * 0.95)
        p95_ms = sorted_latencies[p95_index] if p95_index < len(sorted_latencies) else sorted_latencies[-1]

        return p95_ms / 1000.0  # Convert to seconds

    def get_metrics_summary(self) -> Dict[str, any]:
        """
        Get summary of calculated metrics.

        Returns:
            Dict with all calculated metrics
        """
        return {
            "window": {
                "start": self.window_start.isoformat(),
                "end": self.window_end.isoformat(),
                "hours": self.window_hours,
            },
            "requests": {
                "total": self.total_requests,
                "successful": self.successful_requests,
                "errors_5xx": self.error_requests,
                "status_codes": dict(self.status_codes),
            },
            "availability": self.calculate_availability(),
            "error_rate": self.calculate_error_rate(),
            "latency_p95_seconds": self.calculate_latency_p95(),
            "latency_p95_ms": self.calculate_latency_p95() * 1000,
        }


def format_text_report(metrics: Dict, budgets: List) -> str:
    """
    Format burn rate report as text.

    Args:
        metrics: Calculated metrics
        budgets: Error budget calculations

    Returns:
        Formatted text report
    """
    lines = []
    lines.append("=" * 80)
    lines.append("BURN RATE ANALYSIS FROM LOGS (FR-053)")
    lines.append("=" * 80)
    lines.append("")

    # Time window
    window = metrics["window"]
    lines.append(f"Time Window: {window['hours']} hours")
    lines.append(f"Start: {window['start']}")
    lines.append(f"End: {window['end']}")
    lines.append("")

    # Request summary
    requests = metrics["requests"]
    lines.append("Request Summary:")
    lines.append(f"  Total Requests: {requests['total']}")
    lines.append(f"  Successful: {requests['successful']}")
    lines.append(f"  5xx Errors: {requests['errors_5xx']}")
    lines.append("")

    # Metrics
    lines.append("Calculated Metrics:")
    lines.append(f"  Availability: {metrics['availability']:.4f} ({metrics['availability']*100:.2f}%)")
    lines.append(f"  Error Rate: {metrics['error_rate']:.6f} ({metrics['error_rate']*100:.4f}%)")
    lines.append(f"  Latency P95: {metrics['latency_p95_ms']:.2f} ms")
    lines.append("")

    # Error budgets
    lines.append("Error Budget Analysis:")
    lines.append("-" * 80)

    for budget in budgets:
        status_emoji = "✅" if budget.status == "healthy" else "⚠️" if budget.status == "warning" else "🔴"
        lines.append(f"\n{status_emoji} {budget.slo_name}")
        lines.append(f"  Target: {budget.target:.4f} ({budget.target*100:.2f}%)")
        lines.append(f"  Actual: {budget.actual:.4f} ({budget.actual*100:.2f}%)")
        lines.append(f"  Status: {budget.status.upper()}")
        lines.append(f"  Budget Remaining: {budget.budget_remaining_pct:.1f}%")
        lines.append(f"  Burn Rate: {budget.burn_rate:.2f}x ({budget.burn_rate_level.value})")

        if budget.time_to_exhaustion_hours:
            tte_str = ErrorBudgetCalculator.format_time_to_exhaustion(budget.time_to_exhaustion_hours)
            lines.append(f"  Time to Exhaustion: {tte_str}")

        # Add recommendations
        if budget.status == "critical":
            lines.append("  🚨 ACTION REQUIRED: Halt non-critical deployments!")
        elif budget.status == "warning":
            lines.append("  ⚠️  RECOMMENDATION: Reduce release frequency, increase testing")

    lines.append("")
    lines.append("=" * 80)

    return "\n".join(lines)


def format_json_report(metrics: Dict, budgets: List) -> str:
    """
    Format burn rate report as JSON.

    Args:
        metrics: Calculated metrics
        budgets: Error budget calculations

    Returns:
        JSON string
    """
    budget_data = []
    for budget in budgets:
        budget_data.append({
            "slo_name": budget.slo_name,
            "slo_type": budget.slo_type.value,
            "target": budget.target,
            "actual": budget.actual,
            "status": budget.status,
            "budget_remaining_pct": budget.budget_remaining_pct,
            "burn_rate": budget.burn_rate,
            "burn_rate_level": budget.burn_rate_level.value,
            "time_to_exhaustion_hours": budget.time_to_exhaustion_hours,
        })

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metrics": metrics,
        "error_budgets": budget_data,
    }

    return json.dumps(report, indent=2)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Calculate burn rate from structured JSON logs (FR-053)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze last 24 hours of logs
  python scripts/calculate_burn_rate.py logs/app.log

  # Analyze last 1 hour
  python scripts/calculate_burn_rate.py logs/app.log --window-hours 1

  # Output as JSON for alerting
  python scripts/calculate_burn_rate.py logs/app.log --output json
        """
    )

    parser.add_argument(
        "log_file",
        help="Path to structured JSON log file"
    )

    parser.add_argument(
        "--window-hours",
        type=int,
        default=24,
        help="Time window in hours for analysis (default: 24)"
    )

    parser.add_argument(
        "--output",
        choices=["text", "json"],
        default="text",
        help="Output format (default: text)"
    )

    args = parser.parse_args()

    # Calculate metrics from logs
    print(f"Parsing logs from: {args.log_file}", file=sys.stderr)
    print(f"Time window: {args.window_hours} hours", file=sys.stderr)
    print("", file=sys.stderr)

    calculator = LogMetricsCalculator(window_hours=args.window_hours)
    calculator.parse_log_file(args.log_file)

    metrics = calculator.get_metrics_summary()

    # Calculate error budgets
    slo_metrics = {
        "API Availability": metrics["availability"],
        "API Latency P95": metrics["latency_p95_seconds"],
        "Error Rate": metrics["error_rate"],
    }

    budget_calculator = ErrorBudgetCalculator()
    budgets = budget_calculator.get_error_budget_summary(
        metrics=slo_metrics,
        window_start=calculator.window_start,
        window_end=calculator.window_end,
    )

    # Output report
    if args.output == "json":
        print(format_json_report(metrics, budgets))
    else:
        print(format_text_report(metrics, budgets))


if __name__ == "__main__":
    main()
