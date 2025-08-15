#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}

echo -e "${GREEN}🚀 Deploying to ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Usage: ./deploy.sh [development|staging|production] [web|mobile|all]"
  exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
fi

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
pnpm test

# Type check
echo -e "${YELLOW}Type checking...${NC}"
pnpm type-check

# Build packages
echo -e "${YELLOW}Building packages...${NC}"
pnpm build --filter='./packages/*'

# Deploy Web
if [[ "$SERVICE" == "web" ]] || [[ "$SERVICE" == "all" ]]; then
  echo -e "${GREEN}Deploying Web App...${NC}"
  
  # Build web app
  pnpm build --filter=@repo/web
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    # Run migrations
    echo -e "${YELLOW}Running database migrations...${NC}"
    pnpm db:migrate:prod
    
    # Deploy to Vercel
    vercel --prod --yes
  else
    # Deploy to staging
    vercel --yes
  fi
fi

# Deploy Mobile
if [[ "$SERVICE" == "mobile" ]] || [[ "$SERVICE" == "all" ]]; then
  echo -e "${GREEN}Building Mobile App...${NC}"
  
  cd apps/mobile
  
  # Copy environment file
  cp .env.$ENVIRONMENT .env
  
  # Build with EAS
  if [[ "$ENVIRONMENT" == "production" ]]; then
    eas build --platform all --profile production --non-interactive
    eas submit --platform all --profile production --non-interactive
  else
    eas build --platform all --profile $ENVIRONMENT --non-interactive
  fi
  
  cd ../..
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"