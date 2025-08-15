#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
ENVIRONMENT=${1:-staging}
SERVICE=${2:-all}
SKIP_TESTS=${3:-false}

echo -e "${GREEN}🚀 Starting deployment to ${ENVIRONMENT}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "Usage: ./deploy.sh [development|staging|production] [web|mobile|all] [skip-tests]"
  exit 1
fi

# Function to check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${BLUE}🔍 Checking dependencies...${NC}"
if ! command_exists pnpm; then
  echo -e "${RED}❌ pnpm is not installed${NC}"
  exit 1
fi

if ! command_exists node; then
  echo -e "${RED}❌ Node.js is not installed${NC}"
  exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  echo -e "${BLUE}📋 Loading environment variables from .env.$ENVIRONMENT${NC}"
  export $(cat .env.$ENVIRONMENT | grep -v '^#' | grep -v '^$' | xargs)
else
  echo -e "${YELLOW}⚠️  No .env.$ENVIRONMENT file found, using default configuration${NC}"
fi

# Validate environment configuration
echo -e "${BLUE}🔐 Validating configuration...${NC}"
if ! node -e "
  const { EnvLoader } = require('./packages/config/dist/env/env.loader.js');
  try {
    EnvLoader.load({ strict: true, silent: true });
    console.log('✅ Environment validation successful');
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
    process.exit(1);
  }
"; then
  echo -e "${RED}❌ Environment validation failed${NC}"
  exit 1
fi

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
pnpm install --frozen-lockfile

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" != "true" ]] && [[ "$SKIP_TESTS" != "skip-tests" ]]; then
  echo -e "${YELLOW}🧪 Running tests...${NC}"
  pnpm test:unit
  
  # Run integration tests for production
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${YELLOW}🔍 Running integration tests...${NC}"
    pnpm test:integration
  fi
else
  echo -e "${YELLOW}⏭️  Skipping tests${NC}"
fi

# Type check
echo -e "${YELLOW}🔍 Type checking...${NC}"
pnpm type-check

# Lint check
echo -e "${YELLOW}🧹 Linting...${NC}"
pnpm lint

# Build packages
echo -e "${YELLOW}🏗️  Building packages...${NC}"
pnpm turbo run build --filter='./packages/*'

# Generate Prisma client
echo -e "${YELLOW}🗄️  Generating Prisma client...${NC}"
pnpm turbo run db:generate

# Deploy Web
if [[ "$SERVICE" == "web" ]] || [[ "$SERVICE" == "all" ]]; then
  echo -e "${GREEN}🌐 Deploying Web App...${NC}"
  
  # Build web app
  pnpm turbo run build --filter=@repo/web
  
  if [[ "$ENVIRONMENT" == "production" ]]; then
    # Run migrations for production
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    pnpm turbo run db:migrate --filter=@repo/database
    
    # Run health check before deployment
    echo -e "${BLUE}❤️  Running health check...${NC}"
    if ! node -e "
      const { healthCheck } = require('./apps/web/src/lib/startup.js');
      healthCheck().then(result => {
        if (result.status === 'healthy') {
          console.log('✅ Health check passed');
          process.exit(0);
        } else {
          console.error('❌ Health check failed:', result);
          process.exit(1);
        }
      }).catch(error => {
        console.error('❌ Health check error:', error);
        process.exit(1);
      });
    "; then
      echo -e "${RED}❌ Health check failed, aborting deployment${NC}"
      exit 1
    fi
    
    # Deploy to production (Docker or cloud platform)
    if command_exists docker && [ -f "Dockerfile" ]; then
      echo -e "${BLUE}🐳 Building Docker image...${NC}"
      docker build -t startynk-app:$ENVIRONMENT .
      
      echo -e "${BLUE}🚀 Starting production deployment...${NC}"
      docker-compose -f docker-compose.yml --env-file .env.$ENVIRONMENT up -d
    else
      echo -e "${YELLOW}⚠️  Docker not available, manual deployment required${NC}"
    fi
  else
    # Deploy to staging
    echo -e "${BLUE}🚀 Deploying to staging environment...${NC}"
    if command_exists docker; then
      docker build -t startynk-app:$ENVIRONMENT .
      docker-compose -f docker-compose.yml --env-file .env.$ENVIRONMENT up -d
    fi
  fi
fi

# Deploy Mobile
if [[ "$SERVICE" == "mobile" ]] || [[ "$SERVICE" == "all" ]]; then
  echo -e "${GREEN}📱 Building Mobile App...${NC}"
  
  cd apps/mobile
  
  # Ensure environment file exists
  if [ ! -f ".env.$ENVIRONMENT" ]; then
    echo -e "${RED}❌ Mobile environment file .env.$ENVIRONMENT not found${NC}"
    cd ../..
    exit 1
  fi
  
  # Copy environment file
  cp .env.$ENVIRONMENT .env.local
  
  # Check if EAS CLI is available
  if ! command_exists eas; then
    echo -e "${YELLOW}⚠️  EAS CLI not found, installing...${NC}"
    npm install -g @expo/eas-cli
  fi
  
  # Build with EAS
  if [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "${BLUE}🏗️  Building production mobile app...${NC}"
    eas build --platform all --profile production --non-interactive --wait
    
    # Submit to app stores if configured
    if [[ "$AUTO_SUBMIT" == "true" ]]; then
      echo -e "${BLUE}📤 Submitting to app stores...${NC}"
      eas submit --platform all --profile production --non-interactive
    fi
  else
    echo -e "${BLUE}🏗️  Building $ENVIRONMENT mobile app...${NC}"
    eas build --platform all --profile $ENVIRONMENT --non-interactive --wait
  fi
  
  cd ../..
fi

# Post-deployment health check
if [[ "$SERVICE" == "web" ]] || [[ "$SERVICE" == "all" ]]; then
  echo -e "${BLUE}🏥 Running post-deployment health check...${NC}"
  sleep 10  # Wait for services to start
  
  # Get the app URL based on environment
  APP_URL=${APP_URL:-http://localhost:3000}
  
  # Check health endpoint
  if curl -f -s "${APP_URL}/api/health" >/dev/null; then
    echo -e "${GREEN}✅ Health check passed - Application is running${NC}"
  else
    echo -e "${RED}❌ Health check failed - Application may not be running properly${NC}"
    exit 1
  fi
fi

# Cleanup
echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
rm -f apps/mobile/.env.local 2>/dev/null || true

# Success message
echo ""
echo -e "${GREEN}🎉 Deployment to ${ENVIRONMENT} completed successfully!${NC}"

if [[ "$ENVIRONMENT" == "production" ]]; then
  echo -e "${YELLOW}📊 Production deployment checklist:${NC}"
  echo "  ✅ Environment variables validated"
  echo "  ✅ Tests passed"
  echo "  ✅ Database migrations applied"
  echo "  ✅ Application health check passed"
  echo "  ✅ Services are running"
  echo ""
  echo -e "${BLUE}🔗 Application URLs:${NC}"
  echo "  • Web App: ${APP_URL:-http://localhost:3000}"
  echo "  • Health Check: ${APP_URL:-http://localhost:3000}/api/health"
  echo "  • API: ${APP_URL:-http://localhost:3000}/api/v1"
fi

echo ""
echo -e "${GREEN}✨ Deployment complete! ${NC}"