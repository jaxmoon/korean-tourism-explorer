#!/bin/bash

# Tourism Explorer - Deployment Script
# Usage: ./scripts/deploy.sh [preview|production]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to preview
DEPLOY_ENV="${1:-preview}"

echo -e "${GREEN}Tourism Explorer Deployment Script${NC}"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

# Run pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"
echo ""

# Check for uncommitted changes
if [[ $(git status --porcelain) ]]; then
    echo -e "${YELLOW}Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run linter
echo -e "${YELLOW}Running linter...${NC}"
npm run lint
echo -e "${GREEN}✓ Linting passed${NC}"
echo ""

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm run test -- --run --reporter=verbose 2>&1 | grep -E "(PASS|FAIL|Test Files)"
if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo -e "${RED}✗ Tests failed${NC}"
    echo "Fix test failures before deploying"
    exit 1
fi
echo -e "${GREEN}✓ Tests passed${NC}"
echo ""

# Build production
echo -e "${YELLOW}Building production...${NC}"
npm run build
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Deploy
if [ "$DEPLOY_ENV" == "production" ]; then
    echo -e "${YELLOW}Deploying to PRODUCTION...${NC}"
    echo -e "${RED}This will deploy to live production environment!${NC}"
    read -p "Are you sure? (yes/N) " -r
    echo
    if [[ ! $REPLY == "yes" ]]; then
        echo "Deployment cancelled"
        exit 1
    fi

    vercel --prod

    echo ""
    echo -e "${GREEN}✓ Production deployment complete!${NC}"
    echo ""
    echo "Production URL: https://tourism-explorer.vercel.app"
else
    echo -e "${YELLOW}Deploying to PREVIEW...${NC}"

    vercel

    echo ""
    echo -e "${GREEN}✓ Preview deployment complete!${NC}"
    echo ""
    echo "Test the preview URL and run:"
    echo "  ./scripts/deploy.sh production"
    echo "to deploy to production"
fi

echo ""
echo -e "${GREEN}Deployment successful!${NC}"
