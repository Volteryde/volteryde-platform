#!/bin/bash

# ============================================================================
# Create ECR Repositories Script
# ============================================================================
# Creates all required ECR repositories for Volteryde Platform
# ============================================================================

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

AWS_REGION="sa-east-1"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Creating ECR Repositories${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# List of repositories to create (BACKEND SERVICES ONLY - NO FRONTEND APPS)
repositories=(
    # NestJS Backend Services
    "volteryde/nestjs-service"
    
    # Spring Boot Backend Services
    "volteryde/springboot-auth"
    "volteryde/springboot-payment"
)

created_count=0
existing_count=0
failed_count=0

for repo in "${repositories[@]}"; do
    echo -n "Creating repository: ${repo}... "
    
    if aws ecr describe-repositories --repository-names "${repo}" --region ${AWS_REGION} &> /dev/null; then
        echo -e "${YELLOW}Already exists${NC}"
        ((existing_count++))
    else
        if aws ecr create-repository \
            --repository-name "${repo}" \
            --region ${AWS_REGION} \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --tags Key=Project,Value=Volteryde Key=ManagedBy,Value=Script \
            &> /dev/null; then
            echo -e "${GREEN}Created${NC}"
            ((created_count++))
        else
            echo -e "${RED}Failed${NC}"
            ((failed_count++))
        fi
    fi
done

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "  Created: ${created_count}"
echo -e "  Already existed: ${existing_count}"
echo -e "  Failed: ${failed_count}"
echo -e "${BLUE}============================================================================${NC}"

if [ ${failed_count} -gt 0 ]; then
    echo -e "${RED}Some repositories failed to create. Check AWS permissions.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All ECR repositories ready!${NC}"
echo ""
echo -e "${YELLOW}Next step: Build and push Docker images${NC}"
echo -e "  ./scripts/build-all.sh"
echo ""
