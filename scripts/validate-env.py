#!/usr/bin/env python3
"""
.env File Validator

Validates .env files to ensure:
1. .env.example files don't contain real secrets
2. .env files have all required variables
3. Variable format is correct
4. Sensitive values are properly secured

Usage:
    python scripts/validate-env.py                    # Validate all environments
    python scripts/validate-env.py --env development  # Validate specific env
    python scripts/validate-env.py --strict           # Strict mode (fail on warnings)
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple

# Color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


class EnvValidator:
    """Validator for .env files"""

    # Patterns that indicate a placeholder value (safe)
    PLACEHOLDER_PATTERNS = [
        r'your-.*-here',
        r'replace-in-production',
        r'change-me',
        r'example-.*',
        r'test-.*',
        r'sample-.*',
        r'dummy-.*',
        r'fake-.*',
        r'mock-.*',
    ]

    # Patterns that indicate a real secret (dangerous)
    SECRET_PATTERNS = [
        (r'[A-Za-z0-9+/]{40,}={0,2}', 'Base64-encoded value'),
        (r'[a-f0-9]{64}', '64-character hex string (possible secret key)'),
        (r'AKIA[0-9A-Z]{16}', 'AWS Access Key'),
        (r'sk_live_[a-zA-Z0-9]{24,}', 'Stripe Live Secret Key'),
        (r'pk_live_[a-zA-Z0-9]{24,}', 'Stripe Live Publishable Key'),
        (r'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}', 'SendGrid API Key'),
        (r'railway_[a-zA-Z0-9]{32,}', 'Railway Token'),
        (r'vercel_[a-zA-Z0-9]{32,}', 'Vercel Token'),
    ]

    # Required variables for each environment file
    REQUIRED_VARS = {
        'backend/.env.example': [
            'ENVIRONMENT',
            'DATABASE_URL',
            'SECRET_KEY',
            'CORS_ORIGINS',
        ],
        'backend/.env.preview.example': [
            'ENVIRONMENT',
            'CORS_ORIGINS',
            # DATABASE_URL and SECRET_KEY are auto-injected by Railway
        ],
        'frontend/.env.preview.example': [
            'VITE_ENVIRONMENT',
        ],
    }

    def __init__(self, strict: bool = False):
        self.strict = strict
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.repo_root = Path(__file__).parent.parent

    def validate_file(self, file_path: Path) -> Tuple[bool, List[str], List[str]]:
        """Validate a single .env file"""
        if not file_path.exists():
            return False, [f"File not found: {file_path}"], []

        print(f"\n{Colors.BLUE}📄 Validating: {file_path.relative_to(self.repo_root)}{Colors.END}")

        errors = []
        warnings = []
        variables = {}

        # Read and parse file
        try:
            with open(file_path, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()

                    # Skip comments and empty lines
                    if not line or line.startswith('#'):
                        continue

                    # Parse variable
                    if '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        variables[key] = value

                        # Check for secrets in .example files
                        if '.example' in str(file_path):
                            self._check_for_secrets(key, value, line_num, errors, warnings)

        except Exception as e:
            errors.append(f"Error reading file: {e}")
            return False, errors, warnings

        # Check for required variables
        relative_path = str(file_path.relative_to(self.repo_root))
        if relative_path in self.REQUIRED_VARS:
            for required_var in self.REQUIRED_VARS[relative_path]:
                if required_var not in variables:
                    errors.append(f"Missing required variable: {required_var}")

        # Print results
        if errors:
            for error in errors:
                print(f"  {Colors.RED}❌ {error}{Colors.END}")
        if warnings:
            for warning in warnings:
                print(f"  {Colors.YELLOW}⚠️  {warning}{Colors.END}")
        if not errors and not warnings:
            print(f"  {Colors.GREEN}✅ All checks passed{Colors.END}")

        return len(errors) == 0, errors, warnings

    def _check_for_secrets(self, key: str, value: str, line_num: int, errors: List[str], warnings: List[str]):
        """Check if a value looks like a real secret"""
        if not value:
            return

        # Check if it's a placeholder (safe)
        is_placeholder = any(
            re.search(pattern, value, re.IGNORECASE)
            for pattern in self.PLACEHOLDER_PATTERNS
        )

        if is_placeholder:
            return

        # Check for environment variable references (safe)
        if value.startswith('$') or '${' in value:
            return

        # Check for SQLite URLs (safe)
        if value.startswith('sqlite:///'):
            return

        # Check for localhost/example URLs (safe)
        if any(domain in value.lower() for domain in ['localhost', 'example.com', '127.0.0.1']):
            return

        # Check for common safe values
        safe_values = ['true', 'false', 'development', 'staging', 'production', 'info', 'debug']
        if value.lower() in safe_values:
            return

        # Check for secret patterns
        for pattern, description in self.SECRET_PATTERNS:
            if re.search(pattern, value):
                errors.append(
                    f"Line {line_num}: Potential real secret detected in {key}: {description}"
                )
                return

        # If value is long and complex, warn about it
        if len(value) > 20 and re.search(r'[A-Za-z]', value) and re.search(r'[0-9]', value):
            warnings.append(
                f"Line {line_num}: {key} has a complex value that may be a secret. "
                f"Ensure it's a placeholder."
            )

    def validate_all(self, env_filter: str = None) -> bool:
        """Validate all .env files in the repository"""
        print(f"\n{Colors.BOLD}🔍 Validating .env files...{Colors.END}")

        all_env_files = []

        # Find all .env files
        for pattern in ['**/.env.example', '**/.env.*.example']:
            all_env_files.extend(self.repo_root.glob(pattern))

        if env_filter:
            all_env_files = [f for f in all_env_files if env_filter in str(f)]

        if not all_env_files:
            print(f"{Colors.YELLOW}⚠️  No .env files found{Colors.END}")
            return True

        all_passed = True
        total_errors = 0
        total_warnings = 0

        for env_file in sorted(all_env_files):
            passed, errors, warnings = self.validate_file(env_file)
            if not passed:
                all_passed = False
            total_errors += len(errors)
            total_warnings += len(warnings)

        # Summary
        print(f"\n{Colors.BOLD}📊 Summary:{Colors.END}")
        print(f"  Files checked: {len(all_env_files)}")
        print(f"  Errors: {total_errors}")
        print(f"  Warnings: {total_warnings}")

        if all_passed and total_warnings == 0:
            print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All .env files are valid!{Colors.END}")
            return True
        elif all_passed and total_warnings > 0:
            if self.strict:
                print(f"\n{Colors.RED}{Colors.BOLD}❌ Validation failed (strict mode with warnings){Colors.END}")
                return False
            else:
                print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  Validation passed with warnings{Colors.END}")
                return True
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}❌ Validation failed{Colors.END}")
            return False


def main():
    parser = argparse.ArgumentParser(
        description='Validate .env files for security and correctness',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/validate-env.py                    # Validate all .env files
  python scripts/validate-env.py --env backend      # Validate backend .env files only
  python scripts/validate-env.py --strict           # Fail on warnings
        """
    )
    parser.add_argument(
        '--env',
        help='Filter by environment (e.g., backend, frontend, preview)',
        default=None
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Treat warnings as errors'
    )

    args = parser.parse_args()

    validator = EnvValidator(strict=args.strict)
    success = validator.validate_all(env_filter=args.env)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
