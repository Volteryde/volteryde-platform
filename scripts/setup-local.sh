#!/bin/bash

# Volteryde Platform - Local Development Setup
# Set up the local development environment

set -e

echo "🚀 Setting up Volteryde Platform for local development..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if required tools are installed
echo -e "${BLUE}Checking prerequisites...${NC}"

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting."; exit 1; }
command -v java >/dev/null 2>&1 || { echo "⚠️  Java not found. Java services will not work."; }

echo -e "${GREEN}✓ All prerequisites installed${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"

# Root workspace
pnpm install

# NestJS services
if [ -d "services/volteryde-nest" ]; then
  echo "Installing NestJS dependencies..."
  cd services/volteryde-nest
  pnpm install
  cd ../..
fi

# Java services (Maven)
if [ -d "services/volteryde-springboot" ] && command -v java >/dev/null 2>&1; then
  echo "Installing Java dependencies..."
  cd services/volteryde-springboot
  ./mvnw dependency:resolve
  cd ../..
fi

# Temporal workers
if [ -d "workers/temporal-workers" ]; then
  echo "Installing Temporal workers dependencies..."
  cd workers/temporal-workers
  pnpm install
  cd ../..
fi

# Frontend apps
for app in admin-dashboard driver-app support-app bi-partner-app docs-platform; do
  if [ -d "apps/$app" ]; then
    echo "Installing $app dependencies..."
    cd "apps/$app"
    pnpm install
    cd ../..
  fi
done

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Copy environment files
echo -e "${BLUE}Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
    echo -e "${YELLOW}⚠️  Please update .env with your local configuration${NC}"
  else
    echo -e "${YELLOW}⚠️  No .env.example file found${NC}"
  fi
else
  echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""

# Start Docker services
echo -e "${BLUE}Starting Docker services...${NC}"

if [ -f "docker-compose.yml" ]; then
  docker-compose up -d
  echo -e "${GREEN}✓ Docker services started${NC}"
  echo ""
  echo "Services running:"
  docker-compose ps
else
  echo -e "${YELLOW}⚠️  No docker-compose.yml found${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ Local setup complete!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'pnpm dev' in services/volteryde-nest to start NestJS backend"
echo "3. Run './mvnw spring-boot:run' in services/volteryde-springboot to start Java backend"
echo "4. Run 'pnpm dev' in any app directory to start frontend apps"
echo ""
echo "For more information, see docs/guides/local-development.md"
