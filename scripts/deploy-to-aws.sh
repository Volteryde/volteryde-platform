#!/bin/bash

# ============================================================================
# Volteryde Platform - AWS Deployment Script
# ============================================================================
# This script automates the deployment of the Volteryde Platform to AWS EKS
#
# Usage:
#   ./scripts/deploy-to-aws.sh [environment]
#
# Example:
#   ./scripts/deploy-to-aws.sh production
#   ./scripts/deploy-to-aws.sh staging
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
AWS_REGION="sa-east-1"
EKS_CLUSTER_NAME="volteryde-${ENVIRONMENT}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Volteryde Platform - AWS Deployment${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Environment:${NC} ${ENVIRONMENT}"
echo -e "${GREEN}Region:${NC} ${AWS_REGION}"
echo -e "${GREEN}Cluster:${NC} ${EKS_CLUSTER_NAME}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Function to print step headers
print_step() {
    echo -e "\n${YELLOW}>>> $1${NC}\n"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command_exists aws; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

if ! command_exists kubectl; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Verify AWS credentials
print_step "Verifying AWS credentials..."
aws sts get-caller-identity > /dev/null 2>&1 || {
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
}
echo -e "${GREEN}✓ AWS credentials verified${NC}"

# Update kubeconfig
print_step "Updating kubeconfig for EKS cluster..."
aws eks update-kubeconfig \
    --region ${AWS_REGION} \
    --name ${EKS_CLUSTER_NAME} || {
    echo -e "${RED}Error: Failed to update kubeconfig. Is the EKS cluster created?${NC}"
    exit 1
}
echo -e "${GREEN}✓ Kubeconfig updated${NC}"

# Login to ECR
print_step "Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION} | \
    docker login --username AWS --password-stdin ${ECR_REGISTRY}
echo -e "${GREEN}✓ Logged in to ECR${NC}"

# Build and push Docker images (BACKEND SERVICES ONLY - NO FRONTEND APPS)
print_step "Building and pushing Docker images..."

# NestJS services (build from project root for AMD64 platform)
echo "Building NestJS services..."
docker build --platform linux/amd64 -f services/volteryde-nest/Dockerfile.prod -t ${ECR_REGISTRY}/volteryde/nestjs-service:latest .
docker push ${ECR_REGISTRY}/volteryde/nestjs-service:latest

# Spring Boot services (build from parent directory for multi-module Maven, AMD64 platform)
echo "Building Spring Boot Payment service..."
docker build --platform linux/amd64 -f services/volteryde-springboot/payment-service/Dockerfile \
  -t ${ECR_REGISTRY}/volteryde/springboot-payment:latest \
  --build-arg SERVICE_NAME=payment-service \
  services/volteryde-springboot
docker push ${ECR_REGISTRY}/volteryde/springboot-payment:latest

echo "Building Spring Boot Auth service..."
docker build --platform linux/amd64 -f services/volteryde-springboot/auth-service/Dockerfile \
  -t ${ECR_REGISTRY}/volteryde/springboot-auth:latest \
  --build-arg SERVICE_NAME=auth-service \
  services/volteryde-springboot
docker push ${ECR_REGISTRY}/volteryde/springboot-auth:latest

echo -e "${GREEN}✓ All backend service images built and pushed${NC}"

# Create namespace if it doesn't exist
print_step "Creating Kubernetes namespace..."
kubectl create namespace ${ENVIRONMENT} --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace created/verified${NC}"

# Apply ConfigMaps
print_step "Applying ConfigMaps..."
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml -n ${ENVIRONMENT}
echo -e "${GREEN}✓ ConfigMaps applied${NC}"

# Apply Secrets (if using manual secrets, otherwise External Secrets will handle this)
print_step "Applying Secrets..."
if [ -f "infrastructure/kubernetes/base/secrets.yaml" ]; then
    kubectl apply -f infrastructure/kubernetes/base/secrets.yaml -n ${ENVIRONMENT}
    echo -e "${GREEN}✓ Secrets applied${NC}"
else
    echo -e "${YELLOW}⚠ No secrets.yaml found. Make sure External Secrets is configured.${NC}"
fi

# Deploy services
print_step "Deploying services to Kubernetes..."

echo "Deploying NestJS services..."
kubectl apply -f infrastructure/kubernetes/base/nestjs-deployment.yaml -n ${ENVIRONMENT}

echo -e "${GREEN}✓ Services deployed${NC}"

# Wait for deployments to be ready
print_step "Waiting for deployments to be ready..."

kubectl wait --for=condition=available --timeout=300s \
    deployment/nestjs-service -n ${ENVIRONMENT} || {
    echo -e "${RED}Error: NestJS service deployment failed${NC}"
    kubectl get pods -n ${ENVIRONMENT}
    exit 1
}

echo -e "${GREEN}✓ All deployments ready${NC}"

# Get service endpoints
print_step "Deployment Summary"

echo -e "\n${GREEN}Pods:${NC}"
kubectl get pods -n ${ENVIRONMENT}

echo -e "\n${GREEN}Services:${NC}"
kubectl get services -n ${ENVIRONMENT}

echo -e "\n${GREEN}Ingress:${NC}"
kubectl get ingress -n ${ENVIRONMENT}

# Get Load Balancer DNS
if kubectl get ingress volteryde-ingress -n ${ENVIRONMENT} &> /dev/null; then
    ALB_DNS=$(kubectl get ingress volteryde-ingress -n ${ENVIRONMENT} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    echo -e "\n${GREEN}Load Balancer DNS:${NC} ${ALB_DNS}"
    echo -e "${YELLOW}Update your DNS records to point to this ALB${NC}"
fi

echo -e "\n${BLUE}============================================================================${NC}"
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Update Route 53 DNS records"
echo -e "2. Verify services are running: kubectl get pods -n ${ENVIRONMENT}"
echo -e "3. Check logs: kubectl logs -f deployment/nestjs-service -n ${ENVIRONMENT}"
echo -e "4. Run smoke tests: ./scripts/smoke-tests.sh"
echo ""
