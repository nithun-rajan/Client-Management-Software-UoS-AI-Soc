#!/usr/bin/env python3
"""
Per-Module Coverage Enforcement (SC-013)

Enforces coverage thresholds for critical modules in the codebase.
Ensures critical business logic and security components meet higher coverage standards.

Usage:
    python scripts/check_module_coverage.py [--coverage-file coverage.xml]

Returns exit code 0 if all modules meet thresholds, 1 otherwise.
"""

import argparse
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Tuple


# SC-013: Critical module thresholds
CRITICAL_MODULE_THRESHOLDS = {
    # API endpoints - critical business logic
    "app/api": 80.0,

    # Core business logic
    "app/services": 80.0,

    # Data models
    "app/models": 75.0,

    # Security middleware
    "app/middleware": 85.0,

    # Observability (health, metrics, logging)
    "app/observability": 80.0,

    # Database layer
    "app/core/database.py": 75.0,
}

# Standard module thresholds
STANDARD_MODULE_THRESHOLD = 70.0

# Modules that can have lower coverage (utilities, configs)
RELAXED_MODULES = {
    "app/core/config.py": 60.0,
    "app/__init__.py": 50.0,
}


class CoverageChecker:
    """Check per-module coverage thresholds."""

    def __init__(self, coverage_xml_path: str):
        """
        Initialize checker.

        Args:
            coverage_xml_path: Path to coverage.xml file
        """
        self.coverage_xml_path = coverage_xml_path
        self.module_coverage: Dict[str, Tuple[float, int, int]] = {}

    def parse_coverage_xml(self) -> None:
        """Parse coverage XML file and extract per-module metrics."""
        try:
            tree = ET.parse(self.coverage_xml_path)
            root = tree.getroot()

            # Find all packages/classes
            for package in root.findall('.//package'):
                package_name = package.get('name', '')

                # Process each class (file) in the package
                for cls in package.findall('classes/class'):
                    filename = cls.get('filename', '')
                    if not filename.startswith('app/'):
                        continue

                    # Get line coverage metrics
                    lines = cls.find('lines')
                    if lines is None:
                        continue

                    total_lines = 0
                    covered_lines = 0

                    for line in lines.findall('line'):
                        hits = int(line.get('hits', 0))
                        total_lines += 1
                        if hits > 0:
                            covered_lines += 1

                    if total_lines > 0:
                        coverage_pct = (covered_lines / total_lines) * 100
                        self.module_coverage[filename] = (coverage_pct, covered_lines, total_lines)

        except FileNotFoundError:
            print(f"Error: Coverage file not found: {self.coverage_xml_path}", file=sys.stderr)
            print("Run tests with coverage first: pytest --cov=app --cov-report=xml", file=sys.stderr)
            sys.exit(1)
        except ET.ParseError as e:
            print(f"Error parsing coverage XML: {e}", file=sys.stderr)
            sys.exit(1)

    def get_module_threshold(self, module_path: str) -> float:
        """
        Get the threshold for a given module.

        Args:
            module_path: Path to the module

        Returns:
            Coverage threshold percentage
        """
        # Check for exact match in critical modules
        if module_path in CRITICAL_MODULE_THRESHOLDS:
            return CRITICAL_MODULE_THRESHOLDS[module_path]

        # Check for directory match in critical modules
        for critical_path, threshold in CRITICAL_MODULE_THRESHOLDS.items():
            if module_path.startswith(critical_path + '/'):
                return threshold

        # Check relaxed modules
        if module_path in RELAXED_MODULES:
            return RELAXED_MODULES[module_path]

        # Default to standard threshold
        return STANDARD_MODULE_THRESHOLD

    def check_coverage(self) -> Tuple[bool, List[str]]:
        """
        Check if all modules meet their coverage thresholds.

        Returns:
            Tuple of (all_passed, failure_messages)
        """
        all_passed = True
        failures = []

        # Group modules by threshold category
        critical_modules = {}
        standard_modules = {}
        relaxed_modules_found = {}

        for module_path, (coverage_pct, covered, total) in self.module_coverage.items():
            threshold = self.get_module_threshold(module_path)

            # Categorize module
            is_critical = any(
                module_path == critical_path or module_path.startswith(critical_path + '/')
                for critical_path in CRITICAL_MODULE_THRESHOLDS.keys()
            )
            is_relaxed = module_path in RELAXED_MODULES

            if is_critical:
                critical_modules[module_path] = (coverage_pct, covered, total, threshold)
            elif is_relaxed:
                relaxed_modules_found[module_path] = (coverage_pct, covered, total, threshold)
            else:
                standard_modules[module_path] = (coverage_pct, covered, total, threshold)

            # Check if threshold met
            if coverage_pct < threshold:
                all_passed = False
                failures.append(
                    f"  ❌ {module_path}: {coverage_pct:.2f}% < {threshold:.2f}% "
                    f"(covered {covered}/{total} lines)"
                )

        return all_passed, failures, critical_modules, standard_modules, relaxed_modules_found

    def print_report(
        self,
        all_passed: bool,
        failures: List[str],
        critical_modules: Dict,
        standard_modules: Dict,
        relaxed_modules: Dict
    ) -> None:
        """
        Print coverage report.

        Args:
            all_passed: Whether all modules passed
            failures: List of failure messages
            critical_modules: Dict of critical module coverage
            standard_modules: Dict of standard module coverage
            relaxed_modules: Dict of relaxed module coverage
        """
        print("=" * 80)
        print("PER-MODULE COVERAGE ENFORCEMENT (SC-013)")
        print("=" * 80)
        print()

        # Critical modules
        if critical_modules:
            print("🔒 Critical Modules (≥75-85% coverage required):")
            print("-" * 80)
            for module_path, (coverage_pct, covered, total, threshold) in sorted(critical_modules.items()):
                status = "✅" if coverage_pct >= threshold else "❌"
                print(f"{status} {module_path}")
                print(f"   Coverage: {coverage_pct:.2f}% (threshold: {threshold:.2f}%)")
                print(f"   Lines: {covered}/{total}")
            print()

        # Standard modules
        if standard_modules:
            print(f"📦 Standard Modules (≥{STANDARD_MODULE_THRESHOLD:.0f}% coverage required):")
            print("-" * 80)
            # Only show failures and borderline cases
            for module_path, (coverage_pct, covered, total, threshold) in sorted(standard_modules.items()):
                if coverage_pct < threshold or coverage_pct < threshold + 5:
                    status = "✅" if coverage_pct >= threshold else "❌"
                    print(f"{status} {module_path}: {coverage_pct:.2f}% ({covered}/{total} lines)")
            print(f"   ... ({len(standard_modules)} standard modules checked)")
            print()

        # Relaxed modules
        if relaxed_modules:
            print("⚙️  Configuration/Utility Modules (relaxed thresholds):")
            print("-" * 80)
            for module_path, (coverage_pct, covered, total, threshold) in sorted(relaxed_modules.items()):
                status = "✅" if coverage_pct >= threshold else "❌"
                print(f"{status} {module_path}: {coverage_pct:.2f}% (threshold: {threshold:.2f}%)")
            print()

        # Summary
        total_modules = len(critical_modules) + len(standard_modules) + len(relaxed_modules)
        failed_modules = len(failures)
        passed_modules = total_modules - failed_modules

        print("=" * 80)
        print(f"Summary: {passed_modules}/{total_modules} modules passed coverage thresholds")
        print("=" * 80)

        if not all_passed:
            print()
            print("❌ FAILURES:")
            print("-" * 80)
            for failure in failures:
                print(failure)
            print()
            print("💡 To improve coverage:")
            print("   1. Add tests for uncovered code paths")
            print("   2. Check htmlcov/index.html for detailed coverage report")
            print("   3. Run: pytest --cov=app --cov-report=html")
            print()
        else:
            print()
            print("✅ All modules meet coverage thresholds!")
            print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Enforce per-module coverage thresholds (SC-013)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Module Categories:
  Critical (80-85%): API endpoints, services, middleware, observability
  Standard (70%):    Most application code
  Relaxed (50-60%):  Configuration, utilities

Examples:
  python scripts/check_module_coverage.py
  python scripts/check_module_coverage.py --coverage-file build/coverage.xml
        """
    )

    parser.add_argument(
        "--coverage-file",
        default="coverage.xml",
        help="Path to coverage.xml file (default: coverage.xml)"
    )

    args = parser.parse_args()

    # Check coverage
    checker = CoverageChecker(args.coverage_file)
    checker.parse_coverage_xml()
    all_passed, failures, critical, standard, relaxed = checker.check_coverage()
    checker.print_report(all_passed, failures, critical, standard, relaxed)

    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
