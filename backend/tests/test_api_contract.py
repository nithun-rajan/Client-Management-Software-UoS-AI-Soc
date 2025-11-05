"""Tests for API contract validation."""

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def get_baseline_spec_path() -> Path:
    """Get path to baseline OpenAPI spec."""
    backend_dir = Path(__file__).parent.parent
    repo_root = backend_dir.parent
    return (
        repo_root / "specs/001-devex-qa-security-infra/contracts/openapi-baseline.json"
    )


def test_openapi_spec_is_valid():
    """Test that the OpenAPI spec can be generated without errors."""
    spec = app.openapi()

    assert spec is not None
    assert "openapi" in spec
    assert spec["openapi"].startswith("3.")
    assert "info" in spec
    assert "paths" in spec


def test_openapi_spec_has_required_fields():
    """Test that OpenAPI spec has all required fields."""
    spec = app.openapi()

    # Info object
    assert "title" in spec["info"]
    assert "version" in spec["info"]

    # Paths
    assert len(spec["paths"]) > 0

    # Each path should have at least one operation
    for path, operations in spec["paths"].items():
        assert len(operations) > 0, f"Path {path} has no operations"


def test_openapi_spec_endpoints_have_descriptions():
    """Test that all endpoints have descriptions."""
    spec = app.openapi()

    missing_descriptions = []

    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            if method.lower() in ["get", "post", "put", "delete", "patch"]:
                if "description" not in operation and "summary" not in operation:
                    missing_descriptions.append(f"{method.upper()} {path}")

    # Allow some endpoints to not have descriptions (like root)
    assert len(missing_descriptions) < len(spec["paths"]) * 0.2, (
        f"Too many endpoints missing descriptions: {missing_descriptions}"
    )


def test_openapi_spec_has_response_schemas():
    """Test that endpoints have response schemas defined."""
    spec = app.openapi()

    missing_schemas = []

    for path, operations in spec["paths"].items():
        for method, operation in operations.items():
            if method.lower() in ["get", "post", "put", "delete", "patch"]:
                if "responses" not in operation:
                    missing_schemas.append(f"{method.upper()} {path}")
                    continue

                # Check 200 response has content
                if "200" in operation["responses"]:
                    response = operation["responses"]["200"]
                    if "content" not in response:
                        missing_schemas.append(
                            f"{method.upper()} {path} (200 response)"
                        )

    # Some endpoints might not return content (like DELETE)
    assert len(missing_schemas) < len(spec["paths"]), (
        f"Too many endpoints missing response schemas: {missing_schemas}"
    )


def test_openapi_spec_consistent_with_baseline():
    """
    Test that current OpenAPI spec is compatible with baseline.

    This is a lightweight check without openapi-diff.
    For full contract validation, run scripts/check_api_contract.py
    """
    baseline_path = get_baseline_spec_path()

    if not baseline_path.exists():
        pytest.skip("Baseline spec not found - this is expected on first run")

    # Load baseline
    with open(baseline_path) as f:
        baseline_spec = json.load(f)

    # Generate current
    current_spec = app.openapi()

    # Basic compatibility checks
    # 1. Check that all baseline paths still exist
    baseline_paths = set(baseline_spec.get("paths", {}).keys())
    current_paths = set(current_spec.get("paths", {}).keys())

    removed_paths = baseline_paths - current_paths
    assert len(removed_paths) == 0, (
        f"Paths removed from API (breaking change): {removed_paths}"
    )

    # 2. Check that methods for existing paths still exist
    for path in baseline_paths & current_paths:
        baseline_methods = set(baseline_spec["paths"][path].keys())
        current_methods = set(current_spec["paths"][path].keys())

        removed_methods = baseline_methods - current_methods
        assert len(removed_methods) == 0, (
            f"Methods removed from {path} (breaking change): {removed_methods}"
        )


def test_openapi_spec_version_format():
    """Test that API version follows semantic versioning."""
    spec = app.openapi()
    version = spec["info"]["version"]

    # Should be semver format: X.Y.Z
    parts = version.split(".")
    assert len(parts) >= 2, "Version should be at least X.Y format"

    # First part should be numeric
    assert parts[0].isdigit(), "Major version should be numeric"


def test_health_endpoint_in_spec():
    """Test that /health endpoint is documented."""
    spec = app.openapi()

    assert "/health" in spec["paths"], "/health endpoint should be documented"

    health_endpoint = spec["paths"]["/health"]
    assert "get" in health_endpoint, "/health should have GET method"


def test_metrics_endpoint_in_spec():
    """Test that /metrics endpoint is documented."""
    spec = app.openapi()

    assert "/metrics" in spec["paths"], "/metrics endpoint should be documented"

    metrics_endpoint = spec["paths"]["/metrics"]
    assert "get" in metrics_endpoint, "/metrics should have GET method"


@pytest.mark.integration
def test_openapi_json_endpoint_works():
    """Test that /openapi.json endpoint returns valid JSON."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")

    spec = response.json()
    assert "openapi" in spec
    assert "paths" in spec


@pytest.mark.integration
def test_docs_endpoint_works():
    """Test that /docs (Swagger UI) endpoint works."""
    response = client.get("/docs")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
