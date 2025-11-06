#!/bin/bash
# Setup pre-commit hooks for secret detection
# This script installs and configures pre-commit hooks

set -e  # Exit on error

echo "🔧 Setting up pre-commit hooks for secret detection..."
echo ""

# Check if running in the repository root
if [ ! -f ".pre-commit-config.yaml" ]; then
    echo "❌ Error: .pre-commit-config.yaml not found"
    echo "Please run this script from the repository root"
    exit 1
fi

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is required but not installed"
    exit 1
fi

echo "📦 Installing pre-commit..."
pip3 install --upgrade pre-commit detect-secrets

# Install gitleaks if not already installed
if ! command -v gitleaks &> /dev/null; then
    echo "📦 Installing Gitleaks..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install gitleaks
        else
            echo "⚠️  Warning: Homebrew not found. Please install gitleaks manually:"
            echo "    https://github.com/gitleaks/gitleaks#installing"
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing gitleaks via binary download..."
        GITLEAKS_VERSION="8.18.2"
        wget -q "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
        tar -xzf "gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
        sudo mv gitleaks /usr/local/bin/
        rm "gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
    else
        echo "⚠️  Warning: Unsupported OS. Please install gitleaks manually:"
        echo "    https://github.com/gitleaks/gitleaks#installing"
    fi
fi

# Verify gitleaks installation
if command -v gitleaks &> /dev/null; then
    echo "✅ Gitleaks installed: $(gitleaks version)"
else
    echo "⚠️  Warning: Gitleaks not installed. Some pre-commit hooks will be skipped."
fi

echo ""
echo "🔧 Installing pre-commit hooks..."
pre-commit install

# Install commit-msg hook for commit message validation (optional)
pre-commit install --hook-type commit-msg || true

echo ""
echo "🔍 Creating detect-secrets baseline..."
if [ ! -f ".secrets.baseline" ]; then
    detect-secrets scan --baseline .secrets.baseline \
        --exclude-files '\.git/.*' \
        --exclude-files '.*\.lock$' \
        --exclude-files '.*\.sum$' \
        --exclude-files 'package-lock\.json$' \
        --exclude-files 'bun\.lockb$'
    echo "✅ Baseline created"
else
    echo "ℹ️  Baseline already exists"
fi

echo ""
echo "🧪 Running pre-commit on all files (this may take a moment)..."
pre-commit run --all-files || {
    echo ""
    echo "⚠️  Some pre-commit checks failed. This is normal for first-time setup."
    echo "The hooks will automatically fix many issues."
    echo "Please review the output above and fix any remaining issues."
    echo ""
}

echo ""
echo "✅ Pre-commit hooks installed successfully!"
echo ""
echo "📝 Usage:"
echo "  • Hooks run automatically on 'git commit'"
echo "  • Run manually: pre-commit run --all-files"
echo "  • Update hooks: pre-commit autoupdate"
echo "  • Skip hooks (not recommended): git commit --no-verify"
echo ""
echo "🔒 Secret Detection:"
echo "  • Gitleaks: Scans for hardcoded secrets"
echo "  • detect-secrets: Yelp's secret scanner"
echo "  • Custom checks: .env files, AWS keys, private keys"
echo ""
echo "⚙️  Configuration:"
echo "  • .pre-commit-config.yaml - Hook configuration"
echo "  • .gitleaks.toml - Gitleaks rules"
echo "  • .secrets.baseline - detect-secrets baseline"
echo ""
echo "📚 Documentation:"
echo "  • docs/SECRETS_MANAGEMENT.md"
echo "  • .github/SECRETS.md"
echo ""
