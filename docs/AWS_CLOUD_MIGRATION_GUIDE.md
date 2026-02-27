# AWS Cloud Migration Guide - Volteryde Platform

## Executive Summary

This guide provides a complete roadmap for migrating the Volteryde Platform backend architecture to AWS cloud infrastructure. The migration will enable your engineering team to work collaboratively on a production-grade environment with high availability, scalability, and security.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [AWS Services Mapping](#aws-services-mapping)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Deployment Process](#deployment-process)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring & Observability](#monitoring--observability)
7. [Security & Compliance](#security--compliance)
8. [Cost Optimization](#cost-optimization)
9. [Migration Runbook](#migration-runbook)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Current Architecture (Local)
- **Backend**: NestJS (6 services) + Spring Boot (4 services)
- **Database**: Supabase PostgreSQL (managed)
- **Workflows**: Temporal Cloud (managed)
- **Cache**: Local Redis
- **Time-Series**: Local InfluxDB
- **Message Queue**: Local Kafka
- **Frontend**: 6 React/Next.js apps

### Target AWS Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (sa-east-1)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Route 53 (DNS)                         │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │          CloudFront CDN (Static Assets)                   │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │      Application Load Balancer (ALB)                      │  │
│  │      - SSL/TLS Termination                                │  │
│  │      - Health Checks                                      │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │                                              │
│  ┌────────────────▼─────────────────────────────────────────┐  │
│  │              Amazon EKS Cluster                           │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Node Group 1: NestJS Services (t3.medium)       │    │  │
│  │  │  - booking, charging, fleet, telematics          │    │  │
│  │  │  - notifications, volteryde-api                  │    │  │
│  │  │  Auto-scaling: 3-10 nodes                        │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Node Group 2: Spring Boot Services (t3.large)   │    │  │
│  │  │  - auth, payment, user-management                │    │  │
│  │  │  - client-auth                                   │    │  │
│  │  │  Auto-scaling: 2-6 nodes                         │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Node Group 3: Temporal Workers (t3.small)       │    │  │
│  │  │  Auto-scaling: 2-8 nodes                         │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────┐    │  │
│  │  │  Node Group 4: Frontend Apps (t3.small)          │    │  │
│  │  │  - admin, support, dispatcher, landing, etc.     │    │  │
│  │  │  Auto-scaling: 2-6 nodes                         │    │  │
│  │  └──────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Managed Services                             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  ElastiCache Redis (cache.t3.medium)              │  │  │
│  │  │  - Session storage, rate limiting                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Amazon Timestream (Time-series DB)               │  │  │
│  │  │  - Telematics data, vehicle tracking              │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Amazon MSK (Managed Kafka)                       │  │  │
│  │  │  - Event streaming, domain events                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              External Managed Services                    │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Supabase PostgreSQL (already configured)         │  │  │
│  │  │  - aws-0-sa-east-1.pooler.supabase.com:6543       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Temporal Cloud (already configured)              │  │  │
│  │  │  - sa-east-1.aws.api.temporal.io:7233             │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Storage & Secrets                            │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  S3 Buckets                                        │  │  │
│  │  │  - Static assets, logs, backups                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  AWS Secrets Manager                               │  │  │
│  │  │  - Database credentials, API keys                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  ECR (Container Registry)                          │  │  │
│  │  │  - Docker images for all services                 │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Monitoring & Logging                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  CloudWatch (Logs, Metrics, Alarms)               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  Prometheus + Grafana (on EKS)                     │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  AWS X-Ray (Distributed Tracing)                   │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AWS Services Mapping

### Compute & Orchestration

| Component | Local | AWS Service | Configuration |
|-----------|-------|-------------|---------------|
| Container Orchestration | Docker Compose | Amazon EKS | Kubernetes 1.28+ |
| NestJS Services | Local Node | EKS Pods (t3.medium nodes) | 3-10 replicas per service |
| Spring Boot Services | Local Java | EKS Pods (t3.large nodes) | 2-6 replicas per service |
| Temporal Workers | Local Node | EKS Pods (t3.small nodes) | 2-8 replicas |
| Frontend Apps | Local Dev Server | EKS Pods + CloudFront | 2-6 replicas |
| Load Balancing | nginx | Application Load Balancer | Multi-AZ |

### Data & Storage

| Component | Local | AWS Service | Configuration |
|-----------|-------|-------------|---------------|
| PostgreSQL | Supabase (external) | Supabase PostgreSQL | Already configured |
| Redis Cache | Docker Redis | ElastiCache Redis | cache.t3.medium, Multi-AZ |
| Time-Series DB | Docker InfluxDB | Amazon Timestream | On-demand pricing |
| Message Queue | Docker Kafka | Amazon MSK | kafka.t3.small, 3 brokers |
| Object Storage | Local filesystem | Amazon S3 | Standard + Intelligent-Tiering |
| Secrets | .env files | AWS Secrets Manager | Auto-rotation enabled |

### Networking & Security

| Component | Local | AWS Service | Configuration |
|-----------|-------|-------------|---------------|
| DNS | localhost | Route 53 | Hosted zones |
| CDN | None | CloudFront | Global edge locations |
| SSL/TLS | Self-signed | ACM (Certificate Manager) | Auto-renewal |
| VPN | None | AWS VPN / Direct Connect | Optional |
| Firewall | OS firewall | Security Groups + NACLs | Least privilege |
| WAF | None | AWS WAF | DDoS protection |

### Monitoring & Logging

| Component | Local | AWS Service | Configuration |
|-----------|-------|-------------|---------------|
| Logs | Console | CloudWatch Logs | 30-day retention |
| Metrics | None | CloudWatch Metrics + Prometheus | Custom dashboards |
| Tracing | None | AWS X-Ray | Distributed tracing |
| Alerting | None | CloudWatch Alarms + SNS | PagerDuty integration |
| Dashboards | None | Grafana on EKS | Pre-built dashboards |

---

## Infrastructure Setup

### Phase 1: AWS Account Preparation

#### 1.1 Create AWS Account & Organization

```bash
# If you don't have an AWS account yet:
# 1. Go to https://aws.amazon.com
# 2. Click "Create an AWS Account"
# 3. Follow the signup process
# 4. Enable MFA on root account (CRITICAL!)

# Set up AWS Organizations for multi-account strategy
# Recommended structure:
# - Root Account (billing only)
# - Production Account
# - Staging Account
# - Development Account
```

#### 1.2 Install AWS CLI & Configure Credentials

```bash
# Install AWS CLI v2
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Verify installation
aws --version

# Configure AWS credentials
aws configure
# AWS Access Key ID: <your-access-key>
# AWS Secret Access Key: <your-secret-key>
# Default region name: sa-east-1
# Default output format: json

# Test connection
aws sts get-caller-identity
```

#### 1.3 Install Required Tools

```bash
# Install kubectl
brew install kubectl

# Install eksctl (EKS cluster management)
brew tap weaveworks/tap
brew install weaveworks/tap/eksctl

# Install Helm (Kubernetes package manager)
brew install helm

# Install Terraform (if not already installed)
brew install terraform

# Verify installations
kubectl version --client
eksctl version
helm version
terraform version
```

### Phase 2: Terraform Infrastructure

#### 2.1 Initialize Terraform Backend

Create S3 bucket for Terraform state:

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket volteryde-terraform-state-sa-east-1 \
  --region sa-east-1 \
  --create-bucket-configuration LocationConstraint=sa-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket volteryde-terraform-state-sa-east-1 \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket volteryde-terraform-state-sa-east-1 \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name volteryde-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region sa-east-1
```

#### 2.2 Terraform Configuration Files

I'll create comprehensive Terraform configurations in the next steps. The structure will be:

```
infrastructure/terraform/
├── backend.tf              # S3 backend configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── main.tf                 # Main infrastructure
├── modules/
│   ├── vpc/                # VPC, subnets, NAT gateways
│   ├── eks/                # EKS cluster configuration
│   ├── elasticache/        # Redis cluster
│   ├── msk/                # Managed Kafka
│   ├── timestream/         # Time-series database
│   ├── s3/                 # S3 buckets
│   ├── ecr/                # Container registry
│   ├── secrets/            # Secrets Manager
│   ├── monitoring/         # CloudWatch, alarms
│   └── security/           # IAM roles, security groups
└── environments/
    ├── production/
    │   ├── main.tf
    │   ├── terraform.tfvars
    │   └── backend.tf
    ├── staging/
    └── development/
```

### Phase 3: EKS Cluster Setup

#### 3.1 Create EKS Cluster

```bash
# Create EKS cluster using eksctl
eksctl create cluster \
  --name volteryde-production \
  --region sa-east-1 \
  --version 1.28 \
  --nodegroup-name nestjs-services \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed \
  --with-oidc \
  --ssh-access \
  --ssh-public-key ~/.ssh/id_rsa.pub \
  --full-ecr-access \
  --alb-ingress-access

# This will take 15-20 minutes to complete
```

#### 3.2 Add Additional Node Groups

```bash
# Spring Boot services (larger instances)
eksctl create nodegroup \
  --cluster volteryde-production \
  --region sa-east-1 \
  --name springboot-services \
  --node-type t3.large \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed

# Temporal workers
eksctl create nodegroup \
  --cluster volteryde-production \
  --region sa-east-1 \
  --name temporal-workers \
  --node-type t3.small \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 8 \
  --managed

# Frontend apps
eksctl create nodegroup \
  --cluster volteryde-production \
  --region sa-east-1 \
  --name frontend-apps \
  --node-type t3.small \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed
```

#### 3.3 Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig \
  --region sa-east-1 \
  --name volteryde-production

# Verify connection
kubectl get nodes
kubectl get namespaces
```

#### 3.4 Install Essential Kubernetes Add-ons

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=volteryde-production \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Install Metrics Server (for HPA)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install Cluster Autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

# Install External Secrets Operator (for AWS Secrets Manager)
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets \
  external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace
```

---

## Deployment Process

### Step 1: Create Container Registry (ECR)

```bash
# Create ECR repositories for each service
services=(
  "nestjs-booking"
  "nestjs-charging"
  "nestjs-fleet"
  "nestjs-telematics"
  "nestjs-notifications"
  "nestjs-api"
  "springboot-auth"
  "springboot-payment"
  "springboot-user-management"
  "springboot-client-auth"
  "temporal-workers"
  "admin-dashboard"
  "support-app"
  "dispatcher-app"
  "landing-page"
  "auth-frontend"
  "bi-partner-app"
)

for service in "${services[@]}"; do
  aws ecr create-repository \
    --repository-name volteryde/$service \
    --region sa-east-1 \
    --image-scanning-configuration scanOnPush=true
done

# Get ECR login credentials
aws ecr get-login-password --region sa-east-1 | \
  docker login --username AWS --password-stdin \
  <your-account-id>.dkr.ecr.sa-east-1.amazonaws.com
```

### Step 2: Build and Push Docker Images

```bash
# Set variables
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=sa-east-1
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push NestJS services
cd services/volteryde-nest
docker build -f Dockerfile.prod -t $ECR_REGISTRY/volteryde/nestjs-api:latest .
docker push $ECR_REGISTRY/volteryde/nestjs-api:latest

# Build and push Spring Boot services
cd services/volteryde-springboot/payment-service
docker build -f Dockerfile -t $ECR_REGISTRY/volteryde/springboot-payment:latest .
docker push $ECR_REGISTRY/volteryde/springboot-payment:latest

# Repeat for all services...
# (See CI/CD section for automated builds)
```

### Step 3: Create Kubernetes Namespaces

```bash
# Create namespaces for different environments
kubectl create namespace production
kubectl create namespace staging
kubectl create namespace monitoring

# Set default namespace
kubectl config set-context --current --namespace=production
```

### Step 4: Configure Secrets

```bash
# Create AWS Secrets Manager secrets
aws secretsmanager create-secret \
  --name volteryde/production/database \
  --description "Supabase database credentials" \
  --secret-string '{
    "username": "postgres.etbfbasoqxwxvoqefcuo",
    "password": "x2EOaivfJ9jQoTl9",
    "host": "aws-0-sa-east-1.pooler.supabase.com",
    "port": "6543",
    "database": "postgres"
  }' \
  --region sa-east-1

aws secretsmanager create-secret \
  --name volteryde/production/temporal \
  --description "Temporal Cloud credentials" \
  --secret-string '{
    "api_key": "eyJhbGciOiJFUzI1NiIsImtpZCI6Ild2dHdhQSJ9...",
    "namespace": "quickstart-volteryde.svqe2",
    "address": "sa-east-1.aws.api.temporal.io:7233"
  }' \
  --region sa-east-1

aws secretsmanager create-secret \
  --name volteryde/production/jwt \
  --description "JWT secrets" \
  --secret-string '{
    "secret": "C2Z7xhu2LQ/wFDIwozGw+m93idf3Ml5IcFcsA+vkI0g=",
    "refresh_secret": "your-refresh-secret-here"
  }' \
  --region sa-east-1

# Create External Secrets in Kubernetes
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: aws-secrets-manager
  namespace: production
spec:
  provider:
    aws:
      service: SecretsManager
      region: sa-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: volteryde-secrets
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: volteryde-secrets
    creationPolicy: Owner
  data:
  - secretKey: DATABASE_USER
    remoteRef:
      key: volteryde/production/database
      property: username
  - secretKey: DATABASE_PASSWORD
    remoteRef:
      key: volteryde/production/database
      property: password
  - secretKey: TEMPORAL_API_KEY
    remoteRef:
      key: volteryde/production/temporal
      property: api_key
  - secretKey: JWT_SECRET
    remoteRef:
      key: volteryde/production/jwt
      property: secret
EOF
```

### Step 5: Deploy Services to EKS

```bash
# Apply ConfigMaps
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml -n production

# Apply Secrets (if not using External Secrets)
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml -n production

# Deploy NestJS services
kubectl apply -f infrastructure/kubernetes/base/nestjs-deployment.yaml -n production

# Deploy Temporal workers
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml -n production

# Deploy Spring Boot services (create similar manifests)
kubectl apply -f infrastructure/kubernetes/base/springboot-deployment.yaml -n production

# Deploy frontend apps
kubectl apply -f infrastructure/kubernetes/base/frontend-deployment.yaml -n production

# Verify deployments
kubectl get deployments -n production
kubectl get pods -n production
kubectl get services -n production
```

### Step 6: Configure Ingress & Load Balancer

```bash
# Create Application Load Balancer Ingress
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: volteryde-ingress
  namespace: production
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:sa-east-1:<account-id>:certificate/<cert-id>
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
    alb.ingress.kubernetes.io/ssl-redirect: '443'
spec:
  rules:
  - host: api.volteryde.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nestjs-service
            port:
              number: 80
  - host: auth.volteryde.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: springboot-auth-service
            port:
              number: 80
  - host: admin.volteryde.org
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: admin-dashboard
            port:
              number: 80
EOF

# Get Load Balancer DNS
kubectl get ingress volteryde-ingress -n production
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy-production.yml`:

```yaml
name: Deploy to AWS EKS Production

on:
  push:
    branches:
      - main
  workflow_dispatch:

env:
  AWS_REGION: sa-east-1
  EKS_CLUSTER_NAME: volteryde-production
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.sa-east-1.amazonaws.com

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build, tag, and push NestJS services
      run: |
        cd services/volteryde-nest
        docker build -f Dockerfile.prod -t $ECR_REGISTRY/volteryde/nestjs-api:${{ github.sha }} .
        docker tag $ECR_REGISTRY/volteryde/nestjs-api:${{ github.sha }} $ECR_REGISTRY/volteryde/nestjs-api:latest
        docker push $ECR_REGISTRY/volteryde/nestjs-api:${{ github.sha }}
        docker push $ECR_REGISTRY/volteryde/nestjs-api:latest
    
    - name: Build, tag, and push Spring Boot services
      run: |
        cd services/volteryde-springboot/payment-service
        docker build -f Dockerfile -t $ECR_REGISTRY/volteryde/springboot-payment:${{ github.sha }} .
        docker tag $ECR_REGISTRY/volteryde/springboot-payment:${{ github.sha }} $ECR_REGISTRY/volteryde/springboot-payment:latest
        docker push $ECR_REGISTRY/volteryde/springboot-payment:${{ github.sha }}
        docker push $ECR_REGISTRY/volteryde/springboot-payment:latest
    
    - name: Update kubeconfig
      run: |
        aws eks update-kubeconfig --region $AWS_REGION --name $EKS_CLUSTER_NAME
    
    - name: Deploy to EKS
      run: |
        kubectl set image deployment/nestjs-service \
          nestjs=$ECR_REGISTRY/volteryde/nestjs-api:${{ github.sha }} \
          -n production
        
        kubectl set image deployment/springboot-payment-service \
          springboot-payment=$ECR_REGISTRY/volteryde/springboot-payment:${{ github.sha }} \
          -n production
        
        kubectl rollout status deployment/nestjs-service -n production
        kubectl rollout status deployment/springboot-payment-service -n production
    
    - name: Verify deployment
      run: |
        kubectl get pods -n production
        kubectl get services -n production
```

---

## Monitoring & Observability

### CloudWatch Configuration

```bash
# Create CloudWatch Log Groups
aws logs create-log-group --log-group-name /aws/eks/volteryde-production/nestjs
aws logs create-log-group --log-group-name /aws/eks/volteryde-production/springboot
aws logs create-log-group --log-group-name /aws/eks/volteryde-production/temporal-workers

# Set retention policy (30 days)
aws logs put-retention-policy \
  --log-group-name /aws/eks/volteryde-production/nestjs \
  --retention-in-days 30
```

### Prometheus & Grafana Setup

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80

# Default credentials:
# Username: admin
# Password: prom-operator
```

### CloudWatch Alarms

```bash
# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name volteryde-eks-high-cpu \
  --alarm-description "Alert when EKS cluster CPU > 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EKS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:sa-east-1:<account-id>:volteryde-alerts

# Create memory utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name volteryde-eks-high-memory \
  --alarm-description "Alert when EKS cluster Memory > 85%" \
  --metric-name MemoryUtilization \
  --namespace AWS/EKS \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:sa-east-1:<account-id>:volteryde-alerts
```

---

## Security & Compliance

### IAM Roles & Policies

```bash
# Create IAM role for EKS nodes
aws iam create-role \
  --role-name VolteRydeEKSNodeRole \
  --assume-role-policy-document file://eks-node-trust-policy.json

# Attach required policies
aws iam attach-role-policy \
  --role-name VolteRydeEKSNodeRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

aws iam attach-role-policy \
  --role-name VolteRydeEKSNodeRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy

aws iam attach-role-policy \
  --role-name VolteRydeEKSNodeRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
```

### Security Groups

```bash
# Create security group for EKS cluster
aws ec2 create-security-group \
  --group-name volteryde-eks-cluster-sg \
  --description "Security group for VolteRyde EKS cluster" \
  --vpc-id <vpc-id>

# Allow HTTPS from anywhere (for ALB)
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow internal communication
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol -1 \
  --source-group <sg-id>
```

### Network Policies

```yaml
# Apply Kubernetes Network Policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-nestjs-to-springboot
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: springboot-service
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nestjs-service
    ports:
    - protocol: TCP
      port: 8080
```

---

## Cost Optimization

### Estimated Monthly Costs (Production)

| Service | Configuration | Monthly Cost (USD) |
|---------|--------------|-------------------|
| EKS Cluster | 1 cluster | $73 |
| EC2 Instances (NestJS) | 3-10 x t3.medium | $150-500 |
| EC2 Instances (Spring Boot) | 2-6 x t3.large | $150-450 |
| EC2 Instances (Workers) | 2-8 x t3.small | $60-240 |
| EC2 Instances (Frontend) | 2-6 x t3.small | $60-180 |
| ElastiCache Redis | cache.t3.medium | $60 |
| Amazon Timestream | 10GB storage, 1M writes | $50 |
| Amazon MSK | 3 x kafka.t3.small | $180 |
| Application Load Balancer | 1 ALB | $25 |
| Data Transfer | 500GB/month | $45 |
| CloudWatch | Logs + Metrics | $30 |
| S3 Storage | 100GB | $3 |
| ECR Storage | 50GB | $5 |
| **Total (Minimum)** | | **~$900/month** |
| **Total (Average)** | | **~$1,500/month** |
| **Total (Peak)** | | **~$2,200/month** |

### Cost Optimization Strategies

1. **Use Spot Instances** for non-critical workloads (60-90% savings)
2. **Enable Cluster Autoscaler** to scale down during low traffic
3. **Use S3 Intelligent-Tiering** for automatic cost optimization
4. **Set up CloudWatch Billing Alarms** to monitor spend
5. **Use Reserved Instances** for predictable workloads (up to 72% savings)
6. **Implement pod resource limits** to prevent over-provisioning

```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name volteryde-billing-alarm \
  --alarm-description "Alert when monthly bill exceeds $2000" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --threshold 2000 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## Migration Runbook

### Pre-Migration Checklist

- [ ] AWS account created and configured
- [ ] All tools installed (AWS CLI, kubectl, eksctl, Terraform)
- [ ] Terraform state backend created (S3 + DynamoDB)
- [ ] ECR repositories created
- [ ] Secrets stored in AWS Secrets Manager
- [ ] DNS records prepared in Route 53
- [ ] SSL certificates requested in ACM
- [ ] Team members have AWS access configured
- [ ] Backup of current production data

### Migration Steps

#### Week 1: Infrastructure Setup

**Day 1-2: AWS Foundation**
```bash
# 1. Create VPC and networking
cd infrastructure/terraform/environments/production
terraform init
terraform plan
terraform apply

# 2. Create EKS cluster
eksctl create cluster -f cluster-config.yaml

# 3. Configure kubectl
aws eks update-kubeconfig --name volteryde-production --region sa-east-1
```

**Day 3-4: Managed Services**
```bash
# 1. Create ElastiCache Redis
terraform apply -target=module.elasticache

# 2. Create Amazon Timestream
terraform apply -target=module.timestream

# 3. Create Amazon MSK
terraform apply -target=module.msk

# 4. Verify connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- sh
# Test connections from within cluster
```

**Day 5: Container Registry**
```bash
# 1. Create ECR repositories
./scripts/create-ecr-repos.sh

# 2. Build all Docker images
./scripts/build-all-images.sh

# 3. Push to ECR
./scripts/push-all-images.sh

# 4. Scan images for vulnerabilities
aws ecr start-image-scan --repository-name volteryde/nestjs-api --image-id imageTag=latest
```

#### Week 2: Application Deployment

**Day 1: Deploy Backend Services**
```bash
# 1. Create namespaces
kubectl create namespace production

# 2. Deploy secrets
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml -n production

# 3. Deploy ConfigMaps
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml -n production

# 4. Deploy NestJS services
kubectl apply -f infrastructure/kubernetes/base/nestjs-deployment.yaml -n production

# 5. Deploy Spring Boot services
kubectl apply -f infrastructure/kubernetes/base/springboot-deployment.yaml -n production

# 6. Verify deployments
kubectl get pods -n production
kubectl logs -f deployment/nestjs-service -n production
```

**Day 2: Deploy Workers & Frontend**
```bash
# 1. Deploy Temporal workers
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml -n production

# 2. Deploy frontend apps
kubectl apply -f infrastructure/kubernetes/base/frontend-deployment.yaml -n production

# 3. Verify all services
kubectl get all -n production
```

**Day 3: Configure Ingress & DNS**
```bash
# 1. Deploy ALB Ingress
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml -n production

# 2. Get Load Balancer DNS
ALB_DNS=$(kubectl get ingress volteryde-ingress -n production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# 3. Update Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id <zone-id> \
  --change-batch file://dns-records.json

# 4. Wait for DNS propagation
dig api.volteryde.org
```

**Day 4-5: Testing & Validation**
```bash
# 1. Run smoke tests
./scripts/smoke-tests.sh https://api.volteryde.org

# 2. Run load tests
k6 run infrastructure/k6/load-test.js

# 3. Verify monitoring
# - Check Grafana dashboards
# - Verify CloudWatch logs
# - Test alerting

# 4. Perform security scan
# - Run penetration tests
# - Verify SSL/TLS configuration
# - Check security groups
```

#### Week 3: Monitoring & Optimization

**Day 1-2: Set Up Monitoring**
```bash
# 1. Deploy Prometheus & Grafana
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring

# 2. Configure CloudWatch
./scripts/setup-cloudwatch.sh

# 3. Set up alarms
./scripts/create-alarms.sh

# 4. Configure log aggregation
kubectl apply -f infrastructure/kubernetes/monitoring/fluentd.yaml
```

**Day 3-5: Performance Tuning**
```bash
# 1. Analyze resource usage
kubectl top nodes
kubectl top pods -n production

# 2. Adjust HPA settings
kubectl autoscale deployment nestjs-service --cpu-percent=70 --min=3 --max=10 -n production

# 3. Optimize database queries
# - Review slow query logs
# - Add indexes as needed

# 4. Configure caching
# - Verify Redis connectivity
# - Implement cache warming
```

#### Week 4: Go-Live Preparation

**Day 1-2: Final Testing**
```bash
# 1. Run full regression tests
pnpm test

# 2. Perform disaster recovery drill
# - Test backup restoration
# - Verify failover procedures

# 3. Load testing at scale
k6 run --vus 1000 --duration 30m infrastructure/k6/stress-test.js

# 4. Security audit
# - Review IAM policies
# - Check network policies
# - Verify encryption
```

**Day 3: Documentation & Training**
```bash
# 1. Update runbooks
# 2. Train team on AWS console
# 3. Document troubleshooting procedures
# 4. Create on-call rotation
```

**Day 4-5: Go-Live**
```bash
# 1. Final backup of current system
# 2. Update DNS to point to AWS
# 3. Monitor closely for 24-48 hours
# 4. Decommission old infrastructure (after 1 week of stability)
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n production

# Describe pod for events
kubectl describe pod <pod-name> -n production

# Check logs
kubectl logs <pod-name> -n production

# Common causes:
# - Image pull errors (check ECR permissions)
# - Resource limits (increase CPU/memory)
# - ConfigMap/Secret missing
# - Health check failures
```

#### 2. Database Connection Failures

```bash
# Test connectivity from pod
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- sh
psql "postgresql://postgres.etbfbasoqxwxvoqefcuo:password@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"

# Common causes:
# - Incorrect credentials in secrets
# - Network policy blocking traffic
# - Supabase IP allowlist
# - Security group rules
```

#### 3. High Latency

```bash
# Check pod resource usage
kubectl top pods -n production

# Check node resource usage
kubectl top nodes

# View metrics in Grafana
# - Request latency
# - Database query time
# - Network latency

# Common causes:
# - Insufficient resources
# - Database connection pool exhaustion
# - Network congestion
# - Missing indexes
```

#### 4. Load Balancer Issues

```bash
# Check ALB status
aws elbv2 describe-load-balancers

# Check target health
aws elbv2 describe-target-health --target-group-arn <arn>

# Check ingress
kubectl describe ingress volteryde-ingress -n production

# Common causes:
# - Health check misconfiguration
# - Security group rules
# - Target registration delay
# - SSL certificate issues
```

### Emergency Procedures

#### Rollback Deployment

```bash
# Rollback to previous version
kubectl rollout undo deployment/nestjs-service -n production

# Check rollout status
kubectl rollout status deployment/nestjs-service -n production

# View rollout history
kubectl rollout history deployment/nestjs-service -n production
```

#### Scale Down Quickly

```bash
# Scale down to minimum replicas
kubectl scale deployment/nestjs-service --replicas=1 -n production

# Disable autoscaling temporarily
kubectl delete hpa nestjs-service-hpa -n production
```

#### Emergency Maintenance Mode

```bash
# Deploy maintenance page
kubectl apply -f infrastructure/kubernetes/maintenance-mode.yaml

# This will route all traffic to a static maintenance page
```

---

## Next Steps

### Immediate Actions (This Week)

1. **Set up AWS account** and configure billing alerts
2. **Install required tools** (AWS CLI, kubectl, eksctl, Terraform)
3. **Review and customize** Terraform configurations
4. **Create ECR repositories** for all services
5. **Build Docker images** for all services

### Short Term (Next 2 Weeks)

1. **Deploy to staging environment** first
2. **Run comprehensive tests** in staging
3. **Train team** on AWS console and kubectl
4. **Set up monitoring** and alerting
5. **Perform security audit**

### Medium Term (Next Month)

1. **Deploy to production** following the migration runbook
2. **Monitor performance** and optimize as needed
3. **Implement cost optimization** strategies
4. **Set up disaster recovery** procedures
5. **Document lessons learned**

### Long Term (Next Quarter)

1. **Implement multi-region** deployment for high availability
2. **Set up automated backups** and disaster recovery
3. **Optimize costs** with Reserved Instances and Spot
4. **Implement advanced monitoring** with distributed tracing
5. **Automate infrastructure** updates with GitOps

---

## Support & Resources

### AWS Documentation
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [EKS Workshop](https://www.eksworkshop.com/)

### Internal Resources
- Architecture Docs: `/docs/ARCHITECTURE.md`
- Temporal Guide: `/docs/TEMPORAL_CLOUD_MIGRATION.md`
- Supabase Guide: `/docs/SUPABASE_DEPLOYMENT_GUIDE.md`

### Team Contacts
- DevOps Lead: [Your contact]
- Platform Team: [Team contact]
- On-Call Rotation: [PagerDuty/OpsGenie link]

---

**Last Updated**: February 25, 2026
**Version**: 1.0.0
**Maintained By**: Volteryde Platform Team
