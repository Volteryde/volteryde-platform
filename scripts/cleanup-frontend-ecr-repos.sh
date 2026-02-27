#!/bin/bash

# ============================================================================
# Cleanup Frontend ECR Repositories Script
# ============================================================================
# Deletes ECR repositories that were created for frontend apps
# (Frontend apps should NOT be deployed to EKS)
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
echo -e "${BLUE}Cleaning Up Frontend ECR Repositories${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}This will delete ECR repositories for frontend apps.${NC}"
echo -e "${YELLOW}Frontend apps should be deployed to S3/CloudFront, not EKS.${NC}"
echo ""

# List of frontend repositories to delete
frontend_repos=(
    "volteryde/admin-dashboard"
    "volteryde/support-app"
    "volteryde/dispatcher-app"
    "volteryde/landing-page"
    "volteryde/auth-frontend"
    "volteryde/bi-partner-app"
    "volteryde/nestjs-api"
    "volteryde/nestjs-booking"
    "volteryde/nestjs-charging"
    "volteryde/nestjs-fleet"
    "volteryde/nestjs-telematics"
    "volteryde/nestjs-notifications"
    "volteryde/springboot-service"
    "volteryde/springboot-user-management"
    "volteryde/springboot-client-auth"
)

deleted_count=0
not_found_count=0
failed_count=0

for repo in "${frontend_repos[@]}"; do
    echo -n "Checking repository: ${repo}... "
    
    if aws ecr describe-repositories --repository-names "${repo}" --region ${AWS_REGION} &> /dev/null; then
        echo -e "${YELLOW}Found - deleting...${NC}"
        
        if aws ecr delete-repository \
            --repository-name "${repo}" \
            --region ${AWS_REGION} \
            --force \
            &> /dev/null; then
            echo -e "  ${GREEN}✓ Deleted${NC}"
            ((deleted_count++))
        else
            echo -e "  ${RED}✗ Failed to delete${NC}"
            ((failed_count++))
        fi
    else
        echo -e "${BLUE}Not found (already deleted or never created)${NC}"
        ((not_found_count++))
    fi
done

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Summary:${NC}"
echo -e "  Deleted: ${deleted_count}"
echo -e "  Not found: ${not_found_count}"
echo -e "  Failed: ${failed_count}"
echo -e "${BLUE}============================================================================${NC}"

if [ ${failed_count} -gt 0 ]; then
    echo -e "${RED}Some repositories failed to delete. Check AWS permissions.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Cleanup completed!${NC}"
echo ""
echo -e "${YELLOW}Remaining backend service repositories:${NC}"
aws ecr describe-repositories --region ${AWS_REGION} --query 'repositories[?contains(repositoryName, `volteryde`)].repositoryName' --output table

echo ""
echo -e "${GREEN}Next step: Deploy backend services${NC}"
echo -e "  ./scripts/deploy-to-aws.sh production"
echo ""
