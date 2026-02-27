#!/bin/bash

# ============================================================================
# Fix Deployment Placeholders Script
# ============================================================================
# This script fixes all placeholder values in Kubernetes manifests
# Run this before deploying to AWS
# ============================================================================

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Fixing Deployment Placeholders${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Get AWS Account ID
echo -e "${YELLOW}>>> Getting AWS Account ID...${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null) || {
    echo -e "${RED}Error: Failed to get AWS Account ID. Is AWS CLI configured?${NC}"
    exit 1
}
echo -e "${GREEN}✓ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Set variables
AWS_REGION="sa-east-1"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}✓ ECR Registry: ${ECR_REGISTRY}${NC}"

# Navigate to Kubernetes manifests directory
cd infrastructure/kubernetes/base

echo ""
echo -e "${YELLOW}>>> Fixing image registry URLs...${NC}"

# Fix NestJS deployment
if [ -f "nestjs-deployment.yaml" ]; then
    sed -i.bak "s|REGISTRY_URL|${ECR_REGISTRY}|g" nestjs-deployment.yaml
    echo -e "${GREEN}✓ Fixed nestjs-deployment.yaml${NC}"
fi

# Fix Spring Boot deployment
if [ -f "springboot-deployment.yaml" ]; then
    sed -i.bak "s|REGISTRY_URL|${ECR_REGISTRY}|g" springboot-deployment.yaml
    echo -e "${GREEN}✓ Fixed springboot-deployment.yaml${NC}"
fi

# Fix Temporal workers deployment
if [ -f "temporal-workers-deployment.yaml" ]; then
    sed -i.bak "s|REGISTRY_URL|${ECR_REGISTRY}|g" temporal-workers-deployment.yaml
    echo -e "${GREEN}✓ Fixed temporal-workers-deployment.yaml${NC}"
fi

echo ""
echo -e "${YELLOW}>>> Fixing IAM role ARN...${NC}"

# Fix ServiceAccount
if [ -f "serviceaccount.yaml" ]; then
    sed -i.bak "s|ACCOUNT_ID|${AWS_ACCOUNT_ID}|g" serviceaccount.yaml
    echo -e "${GREEN}✓ Fixed serviceaccount.yaml${NC}"
fi

echo ""
echo -e "${YELLOW}>>> Fixing Ingress configuration...${NC}"

# Fix Ingress - remove HTTPS requirement for testing
if [ -f "ingress.yaml" ]; then
    # Replace REGION and ACCOUNT_ID
    sed -i.bak "s|REGION|${AWS_REGION}|g" ingress.yaml
    sed -i.bak "s|ACCOUNT_ID|${AWS_ACCOUNT_ID}|g" ingress.yaml
    
    # Comment out certificate requirement (can be uncommented later when cert is ready)
    sed -i.bak 's|alb.ingress.kubernetes.io/certificate-arn:|# alb.ingress.kubernetes.io/certificate-arn:|g' ingress.yaml
    
    # Change to HTTP only for initial testing
    sed -i.bak 's|"HTTPS": 443|"HTTP": 80|g' ingress.yaml
    
    echo -e "${GREEN}✓ Fixed ingress.yaml (HTTP only for testing)${NC}"
    echo -e "${YELLOW}  Note: HTTPS disabled. Add ACM certificate ARN to enable HTTPS${NC}"
fi

# Clean up backup files
rm -f *.bak

cd ../../..

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}✓ All placeholders fixed!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Summary of changes:${NC}"
echo -e "  • Image registry: ${ECR_REGISTRY}"
echo -e "  • AWS Account ID: ${AWS_ACCOUNT_ID}"
echo -e "  • AWS Region: ${AWS_REGION}"
echo -e "  • HTTPS: Disabled (HTTP only for testing)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Create EKS cluster: eksctl create cluster -f infrastructure/eksctl/cluster.yaml"
echo -e "  2. Create ECR repositories: ./scripts/create-ecr-repos.sh"
echo -e "  3. Deploy services: ./scripts/deploy-to-aws.sh production"
echo ""
