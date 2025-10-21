#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        📝 GOLIVE DEVOPS - GIT COMMIT & PUSH              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}No changes to commit.${NC}"
    exit 0
fi

# Show current status
echo -e "${BLUE}Current git status:${NC}"
git status -s
echo ""

# Get commit message from argument or prompt
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter commit message:${NC}"
    read -r COMMIT_MESSAGE

    if [ -z "$COMMIT_MESSAGE" ]; then
        echo -e "${RED}Commit message cannot be empty. Aborting.${NC}"
        exit 1
    fi
else
    COMMIT_MESSAGE="$1"
fi

# Show what will be committed
echo ""
echo -e "${BLUE}Files to be committed:${NC}"
git add -A
git status -s
echo ""

# Confirm
echo -e "${YELLOW}Commit message: ${NC}${COMMIT_MESSAGE}"
echo -e "${YELLOW}Continue? (y/n):${NC} "
read -r CONFIRM

if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}Commit cancelled.${NC}"
    git reset
    exit 1
fi

# Create commit
echo ""
echo -e "${BLUE}Creating commit...${NC}"
git commit -m "$(cat <<EOF
${COMMIT_MESSAGE}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Commit created successfully${NC}"
else
    echo -e "${RED}✗ Commit failed${NC}"
    exit 1
fi

# Push to remote
echo ""
echo -e "${BLUE}Pushing to remote...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✅ SUCCESSFULLY COMMITTED & PUSHED             ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Branch: ${NC}${CURRENT_BRANCH}"
    echo -e "${GREEN}Commit: ${NC}$(git rev-parse --short HEAD)"
    echo ""
else
    echo -e "${RED}✗ Push failed${NC}"
    exit 1
fi
