# Git Setup Guide - Adding to Existing Repository

## Option 1: Clone Existing Repo and Move Files

If the repository already exists on GitHub:

```bash
# Clone the repo
cd /Users/edwardaung/Downloads
git clone <your-repo-url> AISocProj-repo

# Move backend files to the cloned repo
cp AISocProj/api.py AISocProj-repo/
cp AISocProj/requirements.txt AISocProj-repo/
cp AISocProj/seed_data.py AISocProj-repo/
cp AISocProj/postman_collection.json AISocProj-repo/
cp AISocProj/*.md AISocProj-repo/
cp AISocProj/test_all_features.py AISocProj-repo/
cp AISocProj/.gitignore AISocProj-repo/

cd AISocProj-repo
```

## Option 2: Initialize and Connect to Remote

If you want to initialize here and connect to existing remote:

```bash
# Initialize git
git init

# Add remote (replace with your repo URL)
git remote add origin <your-repo-url>

# Fetch existing branches
git fetch origin

# Create new branch for your changes
git checkout -b feature/backend-api-implementation

# Add files (frontend excluded by .gitignore)
git add .gitignore
git add api.py
git add requirements.txt
git add seed_data.py
git add postman_collection.json
git add *.md
git add test_all_features.py

# Commit
git commit -m "feat: Add comprehensive backend API with workflow engine, events, and KPIs"

# Push to your branch
git push -u origin feature/backend-api-implementation
```

## Option 3: If Repo Already Exists in Parent Directory

If the repo is in a parent directory:

```bash
# Check parent directories
cd .. && git status
```

