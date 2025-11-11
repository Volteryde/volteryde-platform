#!/bin/bash

# Volteryde Platform - Smoke Tests
# Run basic health checks on deployed services

set -e

ENVIRONMENT=${1:-dev}
BASE_URL=""

case $ENVIRONMENT in
  dev)
    BASE_URL="https://dev-api.volteryde.com"
    ;;
  staging)
    BASE_URL="https://staging-api.volteryde.com"
    ;;
  production)
    BASE_URL="https://api.volteryde.com"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [dev|staging|production]"
    exit 1
    ;;
esac

echo "🧪 Running smoke tests for $ENVIRONMENT environment..."
echo "Base URL: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected_status=${3:-200}
  
  echo -n "Testing $name... "
  
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
  
  if [ "$response" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $response)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC} (Expected HTTP $expected_status, got HTTP $response)"
    ((FAILED++))
  fi
}

# NestJS Backend Health Checks
echo "🔍 NestJS Backend Services"
echo "----------------------------"
test_endpoint "Health Check" "$BASE_URL/health" 200
test_endpoint "Telematics API" "$BASE_URL/api/v1/telematics/health" 200
test_endpoint "Booking API" "$BASE_URL/api/v1/booking/health" 200
test_endpoint "Fleet API" "$BASE_URL/api/v1/fleet/health" 200
test_endpoint "Charging API" "$BASE_URL/api/v1/charging/health" 200
echo ""

# Java Spring Boot Services
echo "🔍 Java Spring Boot Services"
echo "----------------------------"
test_endpoint "Auth Service" "$BASE_URL/api/v1/auth/health" 200
test_endpoint "Payment Service" "$BASE_URL/api/v1/payment/health" 200
echo ""

# API Gateway
echo "🔍 API Gateway"
echo "----------------------------"
test_endpoint "API Gateway" "$BASE_URL/health" 200
test_endpoint "API Version" "$BASE_URL/api/version" 200
echo ""

# Database connectivity (through API)
echo "🔍 Database Connectivity"
echo "----------------------------"
test_endpoint "Database Health" "$BASE_URL/api/v1/health/database" 200
echo ""

# Cache connectivity
echo "🔍 Cache Connectivity"
echo "----------------------------"
test_endpoint "Redis Health" "$BASE_URL/api/v1/health/redis" 200
echo ""

# Summary
echo ""
echo "================================"
echo "Smoke Test Summary"
echo "================================"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some smoke tests failed!${NC}"
  exit 1
fi
