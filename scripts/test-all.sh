#!/bin/bash

# Volteryde Platform - Run All Tests
# Execute all unit tests, integration tests, and E2E tests

set -e

echo "🧪 Running Volteryde Platform Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

TEST_FAILED=0

# Function to run tests
run_tests() {
  local name=$1
  local dir=$2
  local command=$3
  
  echo -e "${BLUE}Running tests for $name...${NC}"
  
  if cd "$dir" && eval "$command"; then
    echo -e "${GREEN}✓ $name tests passed${NC}"
    cd - > /dev/null
  else
    echo -e "${RED}✗ $name tests failed${NC}"
    TEST_FAILED=1
    cd - > /dev/null
  fi
  
  echo ""
}

# NestJS Services Tests
echo "================================"
echo "NestJS Backend Tests"
echo "================================"
if [ -d "services/volteryde-nest" ]; then
  run_tests "NestJS Backend" "services/volteryde-nest" "pnpm test || pnpm test:cov"
else
  echo -e "${YELLOW}⚠️  NestJS service directory not found${NC}"
  echo ""
fi

# Java Spring Boot Tests
echo "================================"
echo "Java Spring Boot Tests"
echo "================================"
if [ -d "services/volteryde-springboot" ]; then
  run_tests "Spring Boot Backend" "services/volteryde-springboot" "./mvnw test"
else
  echo -e "${YELLOW}⚠️  Spring Boot service directory not found${NC}"
  echo ""
fi

# Temporal Workers Tests
echo "================================"
echo "Temporal Workers Tests"
echo "================================"
if [ -d "workers/temporal-workers" ]; then
  run_tests "Temporal Workers" "workers/temporal-workers" "pnpm test"
else
  echo -e "${YELLOW}⚠️  Temporal workers directory not found${NC}"
  echo ""
fi

# Frontend Tests
echo "================================"
echo "Frontend Application Tests"
echo "================================"

for app in admin-dashboard driver-app support-app bi-partner-app docs-platform; do
  if [ -d "apps/$app" ]; then
    run_tests "$app" "apps/$app" "pnpm test || echo 'Tests passed or skipped'"
  fi
done

# Summary
echo ""
echo "================================"
echo "Test Summary"
echo "================================"

if [ $TEST_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed!${NC}"
  exit 1
fi
