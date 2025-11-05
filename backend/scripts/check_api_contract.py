#!/usr/bin/env python3
"""
API Contract Breaking Change Checker

Uses openapi-diff to detect breaking changes in API contracts.
Can be run standalone or imported for testing.
"""

import json
import subprocess
import sys
from pathlib import Path


def get_baseline_spec_path() -> Path:
    """Get path to baseline OpenAPI spec."""
    # Assuming script is in backend/scripts/
    backend_dir = Path(__file__).parent.parent
    repo_root = backend_dir.parent
    return (
        repo_root / "specs/001-devex-qa-security-infra/contracts/openapi-baseline.json"
    )


def generate_current_spec() -> dict:
    """Generate current OpenAPI spec from FastAPI app."""
    print("📝 Generating current OpenAPI specification...")

    # Import here to avoid issues when running as script
    from app.main import app

    spec = app.openapi()
    print(f"✅ Current spec generated ({len(spec.get('paths', {}))} endpoints)")
    return spec


def save_spec(spec: dict, path: Path) -> None:
    """Save OpenAPI spec to file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(spec, f, indent=2)


def check_openapi_diff_installed() -> bool:
    """Check if openapi-diff is installed."""
    try:
        result = subprocess.run(
            ["openapi-diff", "--version"], check=False, capture_output=True, text=True
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def run_openapi_diff(baseline_path: Path, current_path: Path) -> tuple[int, str]:
    """
    Run openapi-diff to compare specs.

    Returns:
        (exit_code, output)
    """
    print("\n🔬 Comparing API contracts...")
    print(f"  Baseline: {baseline_path}")
    print(f"  Current:  {current_path}")
    print()

    result = subprocess.run(
        ["openapi-diff", str(baseline_path), str(current_path)],
        check=False,
        capture_output=True,
        text=True,
    )

    return result.returncode, result.stdout + result.stderr


def analyze_diff_output(output: str) -> dict:
    """
    Analyze openapi-diff output to categorize changes.

    Returns:
        {
            'has_breaking_changes': bool,
            'has_changes': bool,
            'message': str
        }
    """
    output_lower = output.lower()

    if "breaking" in output_lower:
        return {
            "has_breaking_changes": True,
            "has_changes": True,
            "message": "Breaking changes detected",
        }
    if "no changes" in output_lower or "no differences" in output_lower:
        return {
            "has_breaking_changes": False,
            "has_changes": False,
            "message": "No API changes detected",
        }
    return {
        "has_breaking_changes": False,
        "has_changes": True,
        "message": "Non-breaking changes detected",
    }


def main() -> int:
    """Main entry point."""
    print("🔍 API Contract Breaking Change Checker")
    print("=" * 40)
    print()

    # Get paths
    baseline_path = get_baseline_spec_path()
    current_spec_path = Path("/tmp/current-openapi.json")

    try:
        # Generate current spec
        current_spec = generate_current_spec()
        save_spec(current_spec, current_spec_path)

    except Exception as e:
        print(f"❌ Failed to generate current spec: {e}")
        return 1

    # Check if baseline exists
    if not baseline_path.exists():
        print(f"⚠️  No baseline spec found at {baseline_path}")
        print("Creating baseline from current spec...")
        save_spec(current_spec, baseline_path)
        print("✅ Baseline created")
        return 0

    # Check if openapi-diff is installed
    if not check_openapi_diff_installed():
        print("⚠️  openapi-diff not found")
        print("Install with: npm install -g openapi-diff")
        print("Skipping contract check...")
        return 0

    # Run diff
    _exit_code, output = run_openapi_diff(baseline_path, current_spec_path)

    # Analyze output
    analysis = analyze_diff_output(output)

    # Print results
    if analysis["has_breaking_changes"]:
        print("❌ BREAKING CHANGES DETECTED")
        print()
        print(output)
        print()
        print("Breaking changes found in API contract!")
        print("This will break existing clients. Please:")
        print("  1. Review the changes above")
        print("  2. Either fix the breaking changes OR")
        print("  3. If intentional, version the API (e.g., /api/v2/)")
        return 1
    if analysis["has_changes"]:
        print("✅ Non-breaking changes only")
        print()
        print(output)
        return 0
    print("✅ No API changes detected")
    return 0


if __name__ == "__main__":
    sys.exit(main())
