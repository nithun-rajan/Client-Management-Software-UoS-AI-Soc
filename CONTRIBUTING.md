# 🤝 Contributing to Estate Agent CRM

Thank you for your interest in contributing to the Estate Agent CRM! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of experience level, gender, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, or nationality.

### Our Standards

**Examples of behavior that contributes to creating a positive environment:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**

- The use of sexualized language or imagery and unwelcome sexual attention
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at ali.marzooq13@outlook.com. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12 or higher**
- **Node.js 18 or higher** (for frontend)
- **Git**
- **PostgreSQL 14+** (for production-like development) or SQLite (default)

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

```bash
git clone https://github.com/YOUR-USERNAME/client-management.git
cd client-management
```

3. **Add upstream remote:**

```bash
git remote add upstream https://github.com/ORIGINAL-OWNER/client-management.git
```

### Set Up Development Environment

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt  # If available

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run database migrations
# (if using Alembic)
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with backend URL

# Run development server
npm start
```

### Install Pre-commit Hooks

Pre-commit hooks help maintain code quality by running checks before each commit:

```bash
# From project root
pip install pre-commit
pre-commit install

# Test hooks (optional)
pre-commit run --all-files
```

---

## Development Workflow

### 1. Create a Feature Branch

Always create a new branch for your work:

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description

# Or for documentation
git checkout -b docs/documentation-update
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

Run the test suite to ensure everything works:

```bash
# Backend tests
cd backend
pytest --cov

# Frontend tests
cd frontend
npm test

# Run linters
# Backend
ruff check app/
mypy app/

# Frontend
npm run lint
```

### 4. Commit Your Changes

Follow the commit message guidelines (see below):

```bash
git add .
git commit -m "feat: Add your feature description"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a pull request
```

---

## Coding Standards

### Python (Backend)

#### Style Guide

We follow **PEP 8** with some modifications:

- **Line Length**: 120 characters (not 79)
- **Indentation**: 4 spaces (no tabs)
- **Quotes**: Double quotes for strings (unless single quotes avoid escaping)

#### Type Hints

All functions must have type hints:

```python
# ✅ Good
def get_property(property_id: int, db: Session) -> Property:
    return db.query(Property).filter(Property.id == property_id).first()

# ❌ Bad
def get_property(property_id, db):
    return db.query(Property).filter(Property.id == property_id).first()
```

#### Docstrings

Use Google-style docstrings for all public functions and classes:

```python
def calculate_error_budget(slo_config: SLOConfig, actual_value: float) -> ErrorBudget:
    """
    Calculate error budget based on SLO configuration and actual metrics.

    Args:
        slo_config: SLO configuration with target and window
        actual_value: Actual measured value (e.g., 0.9995 for 99.95%)

    Returns:
        ErrorBudget object with budget calculations

    Raises:
        ValueError: If actual_value is invalid
    """
    ...
```

#### Code Organization

```python
# 1. Standard library imports
import os
from datetime import datetime, timezone

# 2. Third-party imports
from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session

# 3. Local application imports
from app.models.property import Property
from app.schemas.property import PropertyResponse
```

#### Naming Conventions

- **Variables and functions**: `snake_case`
- **Classes**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods**: `_leading_underscore`

```python
# ✅ Good
class PropertyRepository:
    DEFAULT_PAGE_SIZE = 100

    def get_available_properties(self, limit: int) -> list[Property]:
        return self._query_with_status("available", limit)

    def _query_with_status(self, status: str, limit: int) -> list[Property]:
        ...

# ❌ Bad
class propertyRepository:
    defaultPageSize = 100

    def GetAvailableProperties(self, Limit):
        return self.QueryWithStatus("available", Limit)
```

### TypeScript (Frontend)

#### Style Guide

- **Line Length**: 100 characters
- **Indentation**: 2 spaces
- **Semicolons**: Always use semicolons
- **Quotes**: Single quotes for strings

#### Type Annotations

Always use TypeScript types:

```typescript
// ✅ Good
interface Property {
  id: number;
  address: string;
  rentPcm: number;
}

const getProperty = async (id: number): Promise<Property> => {
  const response = await fetch(`/api/properties/${id}`);
  return response.json();
};

// ❌ Bad
const getProperty = async (id) => {
  const response = await fetch(`/api/properties/${id}`);
  return response.json();
};
```

#### Component Structure

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { PropertyCard } from './PropertyCard';

// 2. Types/Interfaces
interface PropertyListProps {
  filter?: string;
}

// 3. Component
export const PropertyList: React.FC<PropertyListProps> = ({ filter }) => {
  // Hooks
  const [properties, setProperties] = useState<Property[]>([]);

  // Effects
  useEffect(() => {
    // ...
  }, [filter]);

  // Handlers
  const handlePropertyClick = (id: number) => {
    // ...
  };

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

---

## Testing Guidelines

### Backend Testing

#### Test Structure

```python
# tests/unit/test_property.py
import pytest
from app.models.property import Property
from app.schemas.property import PropertyCreate

class TestPropertyModel:
    """Tests for Property model."""

    def test_create_property(self, db_session):
        """Test creating a property."""
        property_data = PropertyCreate(
            address="123 Test St",
            city="London",
            postcode="SW1A 1AA",
            bedrooms=3,
            bathrooms=2,
            rent_pcm=2000.00,
            property_type="flat",
            status="available",
            landlord_id=1
        )

        property = Property(**property_data.model_dump())
        db_session.add(property)
        db_session.commit()

        assert property.id is not None
        assert property.address == "123 Test St"
```

#### Test Coverage

- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage required
- **Business Logic**: 90% coverage required

Run coverage report:

```bash
pytest --cov=app --cov-report=html --cov-report=term
```

#### Test Categories

- **Unit Tests**: Test individual functions/methods in isolation
- **Integration Tests**: Test API endpoints and database interactions
- **Contract Tests**: Test API contracts (Pact)

### Frontend Testing

```typescript
// PropertyCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PropertyCard } from './PropertyCard';

describe('PropertyCard', () => {
  const mockProperty = {
    id: 1,
    address: '123 Test St',
    rentPcm: 2000,
  };

  it('renders property address', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
  });

  it('displays rent amount', () => {
    render(<PropertyCard property={mockProperty} />);
    expect(screen.getByText('£2,000')).toBeInTheDocument();
  });
});
```

---

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, whitespace)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools
- **ci**: Changes to CI configuration files and scripts
- **revert**: Reverts a previous commit

### Scope (Optional)

The scope should specify the place of the commit change:

- `api`: API layer changes
- `models`: Model changes
- `ui`: Frontend UI changes
- `docs`: Documentation changes
- `tests`: Test changes
- `security`: Security-related changes
- `observability`: Monitoring/logging changes

### Examples

```bash
# Good commit messages
feat(api): Add property search endpoint with advanced filters
fix(models): Correct property rent calculation for leap years
docs(readme): Update installation instructions for Windows
test(api): Add integration tests for landlord endpoints
refactor(database): Extract query builder to separate module
perf(api): Add database indexes for property search
ci(github): Add automated security scanning workflow

# Bad commit messages
update stuff
fix bug
WIP
asdfasdf
```

### Commit Message Body (Optional but Recommended)

```
feat(api): Add error budget tracking endpoint

Implements /error-budget endpoint that returns current SLO status,
budget consumption, and burn rate. Includes:
- Multi-SLO support (availability, latency, error rate)
- Burn rate calculation with status levels
- Time to exhaustion projections

Closes #123
```

---

## Pull Request Process

### Before Submitting

1. ✅ **Tests pass**: Run full test suite
2. ✅ **Linting passes**: No Ruff/ESLint errors
3. ✅ **Type checking passes**: mypy (Python) or tsc (TypeScript)
4. ✅ **Documentation updated**: If adding features
5. ✅ **Pre-commit hooks pass**: All hooks pass
6. ✅ **Rebase on main**: Ensure no conflicts

### Pull Request Title

Use the same format as commit messages:

```
feat(api): Add property search endpoint
fix(models): Correct rent calculation
docs: Update contributing guidelines
```

### Pull Request Description

Use this template:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement

## Related Issues
Closes #123
Fixes #456

## Changes Made
- Added X feature
- Updated Y component
- Fixed Z bug

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing performed
- [ ] Test coverage maintained/improved

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated Checks**: CI pipeline must pass
2. **Code Review**: At least one team member approval required
3. **Error Budget Check**: Ensure error budget healthy (>20%)
4. **Preview Deployment**: Verify changes in preview environment
5. **Final Approval**: Team lead approval for main branch

### After Approval

- PR will be merged using **squash and merge** strategy
- Delete your feature branch after merge
- Monitor deployment for issues

---

## Documentation

### When to Update Documentation

Update documentation when you:

- Add new features
- Change existing behavior
- Add new API endpoints
- Change configuration options
- Add new environment variables
- Change deployment procedures

### Documentation Files

- **README.md**: Project overview and quick start
- **docs/API.md**: API reference documentation
- **docs/ARCHITECTURE.md**: System architecture
- **docs/RUNBOOK.md**: Operational procedures
- **docs/ERROR_BUDGET.md**: SLO and error budget tracking
- **docs/SECURITY.md**: Security best practices
- **docs/DEPLOYMENT.md**: Deployment guide

### Documentation Style

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep it up-to-date
- Link related documents

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code contributions and reviews
- **Email**: ali.marzooq13@outlook.com for security issues

### Getting Help

If you need help:

1. Check the [README](README.md) and documentation
2. Search existing [GitHub Issues](https://github.com/your-org/client-management/issues)
3. Create a new issue if needed
4. Be clear and provide details (code examples, error messages, etc.)

### Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Exact steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: OS, Python version, browser, etc.
- **Logs**: Relevant error messages or logs
- **Screenshots**: If applicable

### Suggesting Features

When suggesting features:

- **Use Case**: Explain why this feature would be useful
- **Proposed Solution**: Describe how you envision it working
- **Alternatives**: Any alternative solutions you've considered
- **Additional Context**: Any other relevant information

### Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email ali.marzooq13@outlook.com with subject "Security Issue"
2. Include detailed description
3. Provide reproduction steps if possible
4. We will respond within 48 hours

---

## License

By contributing to Estate Agent CRM, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

If you have any questions about contributing, please:

- Check this document thoroughly
- Search existing issues and discussions
- Create a new discussion if needed
- Email ali.marzooq13@outlook.com

---

**Thank you for contributing to Estate Agent CRM! 🎉**

Your contributions help make this project better for everyone.

---

**Last Updated**: 2025-11-03
**Team**: Team 67
**Contact**: ali.marzooq13@outlook.com
