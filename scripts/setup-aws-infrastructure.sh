#!/bin/bash

# ============================================================================
# Volteryde Platform - AWS Infrastructure Setup Script
# ============================================================================
# This script sets up the AWS infrastructure using Terraform
#
# Usage:
#   ./scripts/setup-aws-infrastructure.sh [environment]
#
# Example:
#   ./scripts/setup-aws-infrastructure.sh production
# ============================================================================

set -e
set -u

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
AWS_REGION="sa-east-1"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Volteryde Platform - AWS Infrastructure Setup${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Environment:${NC} ${ENVIRONMENT}"
echo -e "${GREEN}Region:${NC} ${AWS_REGION}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

print_step() {
    echo -e "\n${YELLOW}>>> $1${NC}\n"
}

# Check prerequisites
print_step "Checking prerequisites..."

if ! command -v terraform >/dev/null 2>&1; then
    echo -e "${RED}Error: Terraform is not installed${NC}"
    exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"

# Verify AWS credentials
print_step "Verifying AWS credentials..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Create S3 bucket for Terraform state
print_step "Setting up Terraform backend..."

BUCKET_NAME="volteryde-terraform-state-${AWS_REGION}"

if aws s3 ls "s3://${BUCKET_NAME}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo "Creating S3 bucket for Terraform state..."
    aws s3api create-bucket \
        --bucket ${BUCKET_NAME} \
        --region ${AWS_REGION} \
        --create-bucket-configuration LocationConstraint=${AWS_REGION}
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket ${BUCKET_NAME} \
        --versioning-configuration Status=Enabled
    
    # Enable encryption
    aws s3api put-bucket-encryption \
        --bucket ${BUCKET_NAME} \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    echo -e "${GREEN}✓ S3 bucket created${NC}"
else
    echo -e "${GREEN}✓ S3 bucket already exists${NC}"
fi

# Create DynamoDB table for state locking
print_step "Setting up DynamoDB table for state locking..."

TABLE_NAME="volteryde-terraform-locks"

if ! aws dynamodb describe-table --table-name ${TABLE_NAME} --region ${AWS_REGION} &> /dev/null; then
    echo "Creating DynamoDB table..."
    aws dynamodb create-table \
        --table-name ${TABLE_NAME} \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region ${AWS_REGION}
    
    echo "Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name ${TABLE_NAME} --region ${AWS_REGION}
    
    echo -e "${GREEN}✓ DynamoDB table created${NC}"
else
    echo -e "${GREEN}✓ DynamoDB table already exists${NC}"
fi

# Initialize Terraform
print_step "Initializing Terraform..."

cd infrastructure/terraform

terraform init \
    -backend-config="bucket=${BUCKET_NAME}" \
    -backend-config="key=${ENVIRONMENT}/terraform.tfstate" \
    -backend-config="region=${AWS_REGION}" \
    -backend-config="dynamodb_table=${TABLE_NAME}"

echo -e "${GREEN}✓ Terraform initialized${NC}"

# Validate Terraform configuration
print_step "Validating Terraform configuration..."
terraform validate
echo -e "${GREEN}✓ Configuration valid${NC}"

# Plan infrastructure
print_step "Planning infrastructure changes..."
terraform plan \
    -var="environment=${ENVIRONMENT}" \
    -var="aws_region=${AWS_REGION}" \
    -out=tfplan

echo ""
echo -e "${YELLOW}Review the plan above.${NC}"
read -p "Do you want to apply these changes? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

# Apply infrastructure
print_step "Applying infrastructure changes..."
terraform apply tfplan

echo -e "${GREEN}✓ Infrastructure created successfully${NC}"

# Get outputs
print_step "Infrastructure Outputs"
terraform output

# Save important outputs
EKS_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
echo ""
echo -e "${GREEN}EKS Cluster Name:${NC} ${EKS_CLUSTER_NAME}"
echo -e "${YELLOW}Update your kubeconfig:${NC}"
echo -e "  aws eks update-kubeconfig --region ${AWS_REGION} --name ${EKS_CLUSTER_NAME}"

cd ../..

echo -e "\n${BLUE}============================================================================${NC}"
echo -e "${GREEN}✓ Infrastructure setup completed!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Update kubeconfig for EKS cluster"
echo -e "2. Install Kubernetes add-ons (ALB controller, metrics server, etc.)"
echo -e "3. Deploy applications: ./scripts/deploy-to-aws.sh ${ENVIRONMENT}"
echo ""
