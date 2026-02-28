# AWS Infrastructure Setup Guide

## 🎯 Overview

This guide provides step-by-step instructions for setting up the complete AWS infrastructure for the Volteryde Platform across three environments: Development, Staging, and Production.

---

## 🏗️ Infrastructure Architecture

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS ORGANIZATION                             │
│                                                                       │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────┐│
│  │   DEV ACCOUNT        │  │  STAGING ACCOUNT     │  │  PROD ACCT  ││
│  │                      │  │                      │  │             ││
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────┐││
│  │  │ EKS Cluster    │  │  │  │ EKS Cluster    │  │  │  │  EKS   │││
│  │  │ (2-4 nodes)    │  │  │  │ (3-6 nodes)    │  │  │  │ (6-12) │││
│  │  │ t3.medium      │  │  │  │ t3.large       │  │  │  │m5.xlarge│││
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────┘││
│  │                      │  │                      │  │             ││
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────┐││
│  │  │ RDS Postgres   │  │  │  │ RDS Postgres   │  │  │  │  RDS   │││
│  │  │ db.t3.medium   │  │  │  │ db.t3.large    │  │  │  │r6g.xlrg│││
│  │  │ Single-AZ      │  │  │  │ Multi-AZ       │  │  │  │Multi-AZ│││
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────┘││
│  │                      │  │                      │  │             ││
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────┐││
│  │  │ ElastiCache    │  │  │  │ ElastiCache    │  │  │  │ Redis  │││
│  │  │ t3.micro       │  │  │  │ t3.small       │  │  │  │r6g.lrg │││
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────┘││
│  │                      │  │                      │  │             ││
│  │  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────┐││
│  │  │ ALB            │  │  │  │ ALB            │  │  │  │ ALB+WAF│││
│  │  └────────────────┘  │  │  └────────────────┘  │  │  └────────┘││
│  └──────────────────────┘  └──────────────────────┘  └─────────────┘│
│                                                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              SHARED SERVICES (Separate Account)               │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │  │
│  │  │   ECR    │  │ Secrets  │  │   KMS    │  │  CloudWatch  │  │  │
│  │  │ Registry │  │ Manager  │  │   Keys   │  │     Logs     │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### **1. AWS Account Setup**
- [ ] AWS Organization created
- [ ] Separate AWS accounts for Dev, Staging, Production
- [ ] AWS CLI installed and configured
- [ ] Terraform >= 1.5.0 installed
- [ ] kubectl >= 1.28.0 installed
- [ ] eksctl installed

### **2. IAM Permissions**
- [ ] AdministratorAccess for initial setup
- [ ] Separate IAM users/roles for CI/CD per environment

### **3. Domain & SSL**
- [ ] Domain registered (e.g., volteryde.com)
- [ ] SSL certificates in ACM for:
  - `dev-api.volteryde.com`
  - `staging-api.volteryde.com`
  - `api.volteryde.com`

---

## 🚀 Step-by-Step Setup

### **Phase 1: Shared Services (All Environments)**

#### **1.1 Create ECR Repositories**

```bash
# Set AWS region
export AWS_REGION=us-east-1

# Create ECR repositories
aws ecr create-repository \
  --repository-name volteryde/nestjs-service \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --region $AWS_REGION

aws ecr create-repository \
  --repository-name volteryde/springboot-service \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --region $AWS_REGION

aws ecr create-repository \
  --repository-name volteryde/temporal-workers \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256 \
  --region $AWS_REGION

# Set lifecycle policies (keep last 10 images)
cat > lifecycle-policy.json <<EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF

aws ecr put-lifecycle-policy \
  --repository-name volteryde/nestjs-service \
  --lifecycle-policy-text file://lifecycle-policy.json
```

#### **1.2 Create KMS Keys**

```bash
# Create KMS key for secrets encryption
aws kms create-key \
  --description "Volteryde Platform Secrets Encryption" \
  --key-usage ENCRYPT_DECRYPT \
  --region $AWS_REGION

# Create alias
aws kms create-alias \
  --alias-name alias/volteryde-secrets \
  --target-key-id <KEY_ID>
```

---

### **Phase 2: Development Environment**

#### **2.1 Initialize Terraform**

```bash
cd infrastructure/terraform/environments/development

# Initialize Terraform
terraform init

# Review plan
terraform plan

# Apply infrastructure
terraform apply
```

#### **2.2 Create VPC and Networking**

Create `infrastructure/terraform/environments/development/vpc.tf`:

```hcl
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "volteryde-dev-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
  enable_dns_hostnames = true

  tags = {
    Environment = "development"
    Terraform   = "true"
  }
}
```

#### **2.3 Deploy EKS Cluster**

```bash
# Use the EKS module
cd infrastructure/terraform/environments/development

terraform apply -target=module.eks_cluster
```

#### **2.4 Deploy RDS PostgreSQL**

```bash
terraform apply -target=module.rds_postgres
```

#### **2.5 Deploy ElastiCache Redis**

```bash
terraform apply -target=module.elasticache_redis
```

#### **2.6 Configure kubectl**

```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name volteryde-dev
```

#### **2.7 Deploy Kubernetes Resources**

```bash
cd infrastructure/kubernetes/overlays/dev

# Apply base resources
kubectl apply -k .

# Verify deployment
kubectl get all -n volteryde-dev
```

---

### **Phase 3: Staging Environment**

Repeat Phase 2 steps for staging environment:

```bash
cd infrastructure/terraform/environments/staging
terraform init
terraform plan
terraform apply
```

**Key Differences**:
- VPC CIDR: `10.1.0.0/16`
- Instance types: Larger (t3.large, db.t3.large)
- Multi-AZ enabled for RDS
- Longer backup retention (14 days)

---

### **Phase 4: Production Environment**

Repeat Phase 2 steps for production environment with enhanced configuration:

```bash
cd infrastructure/terraform/environments/production
terraform init
terraform plan
terraform apply
```

**Key Differences**:
- VPC CIDR: `10.2.0.0/16`
- Instance types: Production-grade (m5.xlarge, db.r6g.xlarge)
- Multi-AZ enabled for all services
- Read replicas for RDS
- Redis cluster mode enabled
- WAF enabled on ALB
- Enhanced monitoring and alarms
- Deletion protection enabled
- 30-day backup retention

---

## 🔐 IAM Role Configuration

### **Development Environment IAM Role**

```bash
# Create IAM role for GitHub Actions (Dev)
cat > dev-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:Volteryde/volteryde-platform:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name GitHubActions-Dev \
  --assume-role-policy-document file://dev-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name GitHubActions-Dev \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy

aws iam attach-role-policy \
  --role-name GitHubActions-Dev \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

### **Staging Environment IAM Role**

Similar to Dev but with staging-specific permissions.

### **Production Environment IAM Role**

```bash
# Production role with stricter permissions
cat > prod-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:DescribeCluster",
        "eks:ListClusters"
      ],
      "Resource": "arn:aws:eks:us-east-1:${AWS_ACCOUNT_ID}:cluster/volteryde-production"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:DescribeImages"
      ],
      "Resource": "arn:aws:ecr:us-east-1:${AWS_ACCOUNT_ID}:repository/volteryde/*"
    }
  ]
}
EOF
```

---

## 🔒 Secrets Configuration

### **GitHub Secrets Setup**

Navigate to GitHub repository → Settings → Secrets and variables → Actions

#### **Development Secrets**
```bash
AWS_ACCESS_KEY_ID_DEV=<IAM_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY_DEV=<IAM_SECRET_KEY>
DEV_DATABASE_HOST=<RDS_ENDPOINT>
DEV_DATABASE_PASSWORD=<GENERATED_PASSWORD>
DEV_REDIS_HOST=<ELASTICACHE_ENDPOINT>
DEV_JWT_SECRET=<RANDOM_256_BIT_KEY>
```

#### **Staging Secrets**
```bash
AWS_ACCESS_KEY_ID_STAGING=<IAM_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY_STAGING=<IAM_SECRET_KEY>
STAGING_DATABASE_HOST=<RDS_ENDPOINT>
STAGING_DATABASE_PASSWORD=<GENERATED_PASSWORD>
STAGING_REDIS_HOST=<ELASTICACHE_ENDPOINT>
STAGING_JWT_SECRET=<RANDOM_256_BIT_KEY>
```

#### **Production Secrets**
```bash
AWS_ACCESS_KEY_ID_PROD=<IAM_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY_PROD=<IAM_SECRET_KEY>
PROD_DATABASE_HOST=<RDS_ENDPOINT>
PROD_DATABASE_PASSWORD=<GENERATED_PASSWORD>
PROD_REDIS_HOST=<ELASTICACHE_ENDPOINT>
PROD_JWT_SECRET=<RANDOM_256_BIT_KEY>
PROD_BACKUP_BUCKET=volteryde-prod-backups
```

#### **Shared Secrets**
```bash
AWS_ACCOUNT_ID=<AWS_ACCOUNT_ID>
GITGUARDIAN_API_KEY=<GITGUARDIAN_KEY>
CODECOV_TOKEN=<CODECOV_TOKEN>
SLACK_WEBHOOK_URL=<SLACK_WEBHOOK>
TEMPORAL_NAMESPACE=volteryde
TEMPORAL_ADDRESS=<TEMPORAL_CLOUD_ADDRESS>
```

### **AWS Secrets Manager**

```bash
# Store database credentials in Secrets Manager
aws secretsmanager create-secret \
  --name volteryde/dev/database \
  --description "Development database credentials" \
  --secret-string '{
    "username": "postgres",
    "password": "<GENERATED_PASSWORD>",
    "host": "<RDS_ENDPOINT>",
    "port": "5432",
    "database": "volteryde"
  }'

# Enable automatic rotation (optional)
aws secretsmanager rotate-secret \
  --secret-id volteryde/dev/database \
  --rotation-lambda-arn <ROTATION_LAMBDA_ARN> \
  --rotation-rules AutomaticallyAfterDays=30
```

---

## 📊 Monitoring Setup

### **CloudWatch Dashboards**

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name Volteryde-Production \
  --dashboard-body file://cloudwatch-dashboard.json
```

### **CloudWatch Alarms**

```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name volteryde-prod-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EKS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions <SNS_TOPIC_ARN>

# Database Connection Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name volteryde-prod-db-connections \
  --alarm-description "Alert when DB connections exceed 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 240 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions <SNS_TOPIC_ARN>
```

---

## 🧪 Verification Steps

### **1. Verify EKS Cluster**

```bash
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

### **2. Verify RDS Connection**

```bash
psql -h <RDS_ENDPOINT> -U postgres -d volteryde
```

### **3. Verify Redis Connection**

```bash
redis-cli -h <ELASTICACHE_ENDPOINT> ping
```

### **4. Verify ECR Access**

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

### **5. Test Deployment**

```bash
# Trigger a test deployment
git checkout develop
git commit --allow-empty -m "Test deployment"
git push origin develop

# Monitor deployment
gh run watch
```

---

## 🔄 Maintenance

### **Regular Tasks**

**Daily**:
- Monitor CloudWatch alarms
- Review deployment logs
- Check error rates

**Weekly**:
- Review CloudWatch metrics
- Update dependencies
- Rotate access keys (if using keys)

**Monthly**:
- Review AWS costs
- Update Terraform modules
- Security audit
- Backup verification

**Quarterly**:
- Disaster recovery drill
- Performance optimization
- Capacity planning
- Security review

---

## 💰 Cost Optimization

### **Development Environment**
- **Estimated Monthly Cost**: $300-500
- Use t3.medium instances
- Single-AZ RDS
- Minimal backup retention
- Stop non-production resources after hours

### **Staging Environment**
- **Estimated Monthly Cost**: $600-900
- Use t3.large instances
- Multi-AZ RDS
- 14-day backup retention

### **Production Environment**
- **Estimated Monthly Cost**: $2,000-3,500
- Use m5.xlarge instances
- Multi-AZ with read replicas
- 30-day backup retention
- Reserved instances for cost savings

### **Cost Saving Tips**
1. Use Spot instances for non-critical workloads
2. Enable auto-scaling
3. Use S3 lifecycle policies
4. Delete unused snapshots
5. Use AWS Savings Plans

---

## 🆘 Troubleshooting

### **EKS Cluster Not Accessible**
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-east-1 --name volteryde-dev

# Verify IAM permissions
aws sts get-caller-identity
```

### **RDS Connection Timeout**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <SG_ID>

# Verify network connectivity
telnet <RDS_ENDPOINT> 5432
```

### **ECR Push Failed**
```bash
# Re-authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

---

## 📚 Additional Resources

- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Kubernetes Production Best Practices](https://kubernetes.io/docs/setup/best-practices/)

---

**Last Updated**: 2026-02-27  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
