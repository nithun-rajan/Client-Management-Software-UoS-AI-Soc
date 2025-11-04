#!/bin/bash
# API Contract Breaking Change Checker
# Uses openapi-diff to detect breaking changes in API contracts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASELINE_SPEC="../specs/001-devex-qa-security-infra/contracts/openapi-baseline.json"
CURRENT_SPEC="/tmp/current-openapi.json"

echo "🔍 API Contract Breaking Change Checker"
echo "========================================="
echo ""

# Step 1: Generate current OpenAPI spec
echo "📝 Generating current OpenAPI specification..."
python -c "
from app.main import app
import json

spec = app.openapi()
with open('$CURRENT_SPEC', 'w') as f:
    json.dump(spec, f, indent=2)

print('✅ Current spec generated')
"

if [ ! -f "$CURRENT_SPEC" ]; then
    echo -e "${RED}❌ Failed to generate current OpenAPI spec${NC}"
    exit 1
fi

# Step 2: Check if baseline exists
if [ ! -f "$BASELINE_SPEC" ]; then
    echo -e "${YELLOW}⚠️  No baseline spec found at $BASELINE_SPEC${NC}"
    echo "Creating baseline from current spec..."
    cp "$CURRENT_SPEC" "$BASELINE_SPEC"
    echo -e "${GREEN}✅ Baseline created${NC}"
    exit 0
fi

# Step 3: Check if openapi-diff is installed
if ! command -v openapi-diff &> /dev/null; then
    echo -e "${YELLOW}⚠️  openapi-diff not found, installing...${NC}"
    npm install -g openapi-diff || {
        echo -e "${RED}❌ Failed to install openapi-diff${NC}"
        echo "Install manually: npm install -g openapi-diff"
        exit 1
    }
fi

# Step 4: Run openapi-diff
echo ""
echo "🔬 Comparing API contracts..."
echo "  Baseline: $BASELINE_SPEC"
echo "  Current:  $CURRENT_SPEC"
echo ""

# Run diff and capture output
DIFF_OUTPUT=$(openapi-diff "$BASELINE_SPEC" "$CURRENT_SPEC" 2>&1 || true)

# Check for breaking changes
if echo "$DIFF_OUTPUT" | grep -q "breaking"; then
    echo -e "${RED}❌ BREAKING CHANGES DETECTED${NC}"
    echo ""
    echo "$DIFF_OUTPUT"
    echo ""
    echo -e "${RED}Breaking changes found in API contract!${NC}"
    echo "This will break existing clients. Please:"
    echo "  1. Review the changes above"
    echo "  2. Either fix the breaking changes OR"
    echo "  3. If intentional, version the API (e.g., /api/v2/)"
    exit 1
elif echo "$DIFF_OUTPUT" | grep -q "No changes"; then
    echo -e "${GREEN}✅ No API changes detected${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Non-breaking changes only${NC}"
    echo ""
    echo "$DIFF_OUTPUT"
    exit 0
fi
