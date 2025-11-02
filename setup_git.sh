#!/bin/bash
# Git setup script for backend files only

echo "🚀 Git Setup for Backend API"
echo "=============================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Check for remote
REMOTE=$(git remote get-url origin 2>/dev/null)

if [ -z "$REMOTE" ]; then
    echo ""
    echo "⚠️  No remote repository found."
    echo "Please provide your GitHub repository URL:"
    read -p "Repository URL (e.g., https://github.com/user/repo.git): " REPO_URL
    
    if [ ! -z "$REPO_URL" ]; then
        git remote add origin "$REPO_URL"
        echo "✅ Remote added: $REPO_URL"
        
        # Fetch existing branches
        echo "📥 Fetching existing branches..."
        git fetch origin
    fi
else
    echo "✅ Remote found: $REMOTE"
fi

echo ""
echo "🌿 Creating feature branch..."
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

if [ -z "$CURRENT_BRANCH" ]; then
    # Check if main/master exists
    if git show-ref --verify --quiet refs/remotes/origin/main; then
        git checkout -b feature/backend-api-implementation origin/main
    elif git show-ref --verify --quiet refs/remotes/origin/master; then
        git checkout -b feature/backend-api-implementation origin/master
    else
        git checkout -b feature/backend-api-implementation
    fi
else
    echo "   Currently on: $CURRENT_BRANCH"
    read -p "Create new branch? (y/n): " CREATE_BRANCH
    if [ "$CREATE_BRANCH" = "y" ]; then
        read -p "Branch name (default: feature/backend-api-implementation): " BRANCH_NAME
        BRANCH_NAME=${BRANCH_NAME:-feature/backend-api-implementation}
        git checkout -b "$BRANCH_NAME"
    fi
fi

echo ""
echo "📝 Adding backend files (frontend excluded by .gitignore)..."
git add .gitignore
git add api.py
git add requirements.txt
git add seed_data.py
git add postman_collection.json
git add *.md
git add test_all_features.py

echo ""
echo "📋 Files staged:"
git status --short

echo ""
read -p "Commit these changes? (y/n): " COMMIT
if [ "$COMMIT" = "y" ]; then
    read -p "Commit message (default: feat: Add backend API with workflow engine): " COMMIT_MSG
    COMMIT_MSG=${COMMIT_MSG:-feat: Add backend API with workflow engine, events, and KPIs}
    git commit -m "$COMMIT_MSG"
    echo "✅ Committed!"
fi

echo ""
read -p "Push to remote? (y/n): " PUSH
if [ "$PUSH" = "y" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    git push -u origin "$CURRENT_BRANCH"
    echo "✅ Pushed to: $CURRENT_BRANCH"
    echo ""
    echo "🎉 Next step: Create Pull Request on GitHub!"
fi

