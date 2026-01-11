#!/bin/bash

# Volteryde Platform - Build All Services
# Build all backend services and frontend applications

set -e

echo "🏗️  Building Volteryde Platform..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BUILD_FAILED=0

# Function to build service
build_service() {
  local name=$1
  local dir=$2
  local command=$3
  
  echo -e "${BLUE}Building $name...${NC}"
  
  if cd "$dir" && eval "$command"; then
    echo -e "${GREEN}✓ $name built successfully${NC}"
    cd - > /dev/null
  else
    echo -e "${RED}✗ $name build failed${NC}"
    BUILD_FAILED=1
    cd - > /dev/null
  fi
  
  echo ""
}

# Build NestJS Services
echo "================================"
echo "Building NestJS Services"
echo "================================"
build_service "NestJS Backend" "services/volteryde-nest" "pnpm install && pnpm build"

# Build Java Spring Boot Services
echo "================================"
echo "Building Java Spring Boot Services"
echo "================================"
build_service "Spring Boot Backend" "services/volteryde-springboot" "./mvnw clean package -DskipTests"

# Build Temporal Workers
echo "================================"
echo "Building Temporal Workers"
echo "================================"
build_service "Temporal Workers" "workers/temporal-workers" "pnpm install && pnpm build"

# Build Frontend Applications
echo "================================"
echo "Building Frontend Applications"
echo "================================"

if [ -d "apps/admin-dashboard" ]; then
  build_service "Admin Dashboard" "apps/admin-dashboard" "pnpm install && pnpm build"
fi

if [ -d "apps/driver-app" ]; then
  build_service "Driver App" "apps/driver-app" "pnpm install && pnpm build"
fi

if [ -d "apps/support-app" ]; then
  build_service "Support App" "apps/support-app" "pnpm install && pnpm build"
fi

if [ -d "apps/bi-partner-app" ]; then
  build_service "BI Partner App" "apps/bi-partner-app" "pnpm install && pnpm build"
fi



# Summary
echo ""
echo "================================"
echo "Build Summary"
echo "================================"

if [ $BUILD_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All services built successfully!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some builds failed!${NC}"
  exit 1
fi
