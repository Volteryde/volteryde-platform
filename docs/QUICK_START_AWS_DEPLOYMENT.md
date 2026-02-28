# Quick Start: AWS Cloud Deployment

## 🚀 Get Your Backend Running on AWS in 1 Hour

This guide will get your Volteryde Platform running on AWS cloud infrastructure quickly. For detailed information, see the [complete AWS Cloud Migration Guide](./AWS_CLOUD_MIGRATION_GUIDE.md).

---

## Prerequisites (15 minutes)

### 1. Install Required Tools

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Install kubectl
brew install kubectl

# Install eksctl
brew install eksctl

# Install Terraform
brew install terraform

# Verify installations
aws --version
kubectl version --client
eksctl version
terraform version
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: sa-east-1
# Default output format: json

# Verify connection
aws sts get-caller-identity
```

---

## Step 1: Set Up Infrastructure (20 minutes)

### Option A: Automated Setup (Recommended)

```bash
# Make script executable
chmod +x scripts/setup-aws-infrastructure.sh

# Run infrastructure setup
./scripts/setup-aws-infrastructure.sh production
```

This script will:
- Create S3 bucket for Terraform state
- Create DynamoDB table for state locking
- Initialize Terraform
- Create VPC, EKS cluster, ElastiCache, MSK, Timestream
- Set up ECR repositories
- Configure monitoring and logging

### Option B: Manual Terraform Setup

```bash
# Navigate to Terraform directory
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var="environment=production"

# Apply infrastructure
terraform apply -var="environment=production"

# Save outputs
terraform output > ../../terraform-outputs.txt

cd ../..
```

---

## Step 2: Configure Kubernetes (10 minutes)

### Update kubeconfig

```bash
# Get cluster name from Terraform outputs
aws eks update-kubeconfig --region sa-east-1 --name volteryde-production

# Verify connection
kubectl get nodes
```

### Install Essential Add-ons

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=volteryde-production

# Install Metrics Server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  -n external-secrets-system \
  --create-namespace
```

---

## Step 3: Configure Secrets (5 minutes)

### Create AWS Secrets

```bash
# Database credentials (RDS PostgreSQL)
aws secretsmanager create-secret \
  --name volteryde/production/database \
  --secret-string '{
    "username": "postgres",
    "password": "YOUR_DATABASE_PASSWORD",
    "host": "YOUR_RDS_ENDPOINT.rds.amazonaws.com",
    "port": "5432",
    "database": "volteryde"
  }' \
  --region sa-east-1

# Temporal Cloud credentials
aws secretsmanager create-secret \
  --name volteryde/production/temporal \
  --secret-string '{
    "api_key": "eyJhbGciOiJFUzI1NiIsImtpZCI6Ild2dHdhQSJ9...",
    "namespace": "quickstart-volteryde.svqe2",
    "address": "sa-east-1.aws.api.temporal.io:7233"
  }' \
  --region sa-east-1

# JWT secrets
aws secretsmanager create-secret \
  --name volteryde/production/jwt \
  --secret-string '{
    "secret": "C2Z7xhu2LQ/wFDIwozGw+m93idf3Ml5IcFcsA+vkI0g="
  }' \
  --region sa-east-1
```

---

## Step 4: Deploy Applications (15 minutes)

### Option A: Automated Deployment (Recommended)

```bash
# Make script executable
chmod +x scripts/deploy-to-aws.sh

# Deploy all services
./scripts/deploy-to-aws.sh production
```

### Option B: Manual Deployment

```bash
# Get AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export ECR_REGISTRY=$AWS_ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com

# Login to ECR
aws ecr get-login-password --region sa-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push images (example for NestJS)
cd services/volteryde-nest
docker build -f Dockerfile.prod -t $ECR_REGISTRY/volteryde/nestjs-api:latest .
docker push $ECR_REGISTRY/volteryde/nestjs-api:latest
cd ../..

# Create namespace
kubectl create namespace production

# Apply configurations
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml -n production
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml -n production

# Deploy services
kubectl apply -f infrastructure/kubernetes/base/nestjs-deployment.yaml -n production
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml -n production

# Wait for deployments
kubectl wait --for=condition=available --timeout=300s \
  deployment/nestjs-service -n production
```

---

## Step 5: Verify Deployment (5 minutes)

### Check Pod Status

```bash
# View all pods
kubectl get pods -n production

# Check specific deployment
kubectl get deployment nestjs-service -n production

# View logs
kubectl logs -f deployment/nestjs-service -n production
```

### Get Service Endpoints

```bash
# Get all services
kubectl get services -n production

# Get ingress
kubectl get ingress -n production

# Get Load Balancer DNS
kubectl get ingress volteryde-ingress -n production \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

### Test API Endpoint

```bash
# Get ALB DNS
ALB_DNS=$(kubectl get ingress volteryde-ingress -n production \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoint
curl http://$ALB_DNS/health
```

---

## Step 6: Configure DNS (5 minutes)

### Update Route 53 Records

```bash
# Get Load Balancer DNS
ALB_DNS=$(kubectl get ingress volteryde-ingress -n production \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo "Update your DNS records to point to: $ALB_DNS"
```

### Create DNS Records

In AWS Route 53 console:

1. Go to your hosted zone
2. Create A record (Alias):
   - Name: `api.volteryde.org`
   - Type: A - IPv4 address
   - Alias: Yes
   - Alias Target: Select your ALB
3. Repeat for other subdomains:
   - `auth.volteryde.org`
   - `admin.volteryde.org`
   - `support.volteryde.org`

---

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod <pod-name> -n production

# Check events
kubectl get events -n production --sort-by='.lastTimestamp'

# View logs
kubectl logs <pod-name> -n production
```

### Database Connection Issues

```bash
# Test from within cluster
kubectl run -it --rm debug --image=postgres:15 --restart=Never -- sh
psql "postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT.rds.amazonaws.com:5432/volteryde"
```

### Image Pull Errors

```bash
# Verify ECR login
aws ecr get-login-password --region sa-east-1 | \
  docker login --username AWS --password-stdin $ECR_REGISTRY

# Check repository exists
aws ecr describe-repositories --region sa-east-1

# Verify image exists
aws ecr list-images --repository-name volteryde/nestjs-api --region sa-east-1
```

---

## Next Steps

### 1. Set Up Monitoring

```bash
# Install Prometheus & Grafana
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Username: admin
# Password: prom-operator
```

### 2. Configure CI/CD

Update `.github/workflows/deploy-production.yml` with your AWS credentials in GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCOUNT_ID`

### 3. Set Up Alerts

```bash
# Create SNS topic for alerts
aws sns create-topic --name volteryde-alerts --region sa-east-1

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:sa-east-1:<account-id>:volteryde-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com
```

### 4. Enable Auto-Scaling

```bash
# Horizontal Pod Autoscaler is already configured
# Verify HPA
kubectl get hpa -n production

# Cluster Autoscaler should be running
kubectl get deployment cluster-autoscaler -n kube-system
```

---

## Cost Monitoring

### Set Up Billing Alerts

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
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:sa-east-1:<account-id>:volteryde-alerts
```

### View Current Costs

```bash
# Check AWS Cost Explorer in console
# Or use CLI
aws ce get-cost-and-usage \
  --time-period Start=2026-02-01,End=2026-02-28 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

---

## Useful Commands

### Scaling

```bash
# Scale deployment manually
kubectl scale deployment nestjs-service --replicas=5 -n production

# View current replicas
kubectl get deployment nestjs-service -n production
```

### Logs

```bash
# Stream logs from all pods in deployment
kubectl logs -f deployment/nestjs-service -n production

# Get logs from specific pod
kubectl logs <pod-name> -n production

# Get logs from previous crashed container
kubectl logs <pod-name> -n production --previous
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/nestjs-service -n production

# Rollback to previous version
kubectl rollout undo deployment/nestjs-service -n production

# Rollback to specific revision
kubectl rollout undo deployment/nestjs-service --to-revision=2 -n production
```

### Resource Usage

```bash
# View node resource usage
kubectl top nodes

# View pod resource usage
kubectl top pods -n production

# View resource requests/limits
kubectl describe deployment nestjs-service -n production
```

---

## Emergency Procedures

### Maintenance Mode

```bash
# Scale down all services
kubectl scale deployment --all --replicas=0 -n production

# Scale back up
kubectl scale deployment nestjs-service --replicas=3 -n production
```

### Complete Teardown

```bash
# Delete all Kubernetes resources
kubectl delete namespace production

# Destroy infrastructure (CAREFUL!)
cd infrastructure/terraform
terraform destroy -var="environment=production"
```

---

## Support

- **Documentation**: `/docs/AWS_CLOUD_MIGRATION_GUIDE.md`
- **Temporal Guide**: `/docs/TEMPORAL_CLOUD_MIGRATION.md`
- **Infrastructure Setup**: `/docs/AWS_INFRASTRUCTURE_SETUP.md`
- **AWS Support**: https://console.aws.amazon.com/support/
- **EKS Best Practices**: https://aws.github.io/aws-eks-best-practices/

---

## Summary

You now have:

✅ AWS infrastructure (VPC, EKS, ElastiCache, MSK, Timestream)  
✅ Kubernetes cluster with auto-scaling  
✅ Container registry (ECR) with all images  
✅ Deployed backend services (NestJS + Spring Boot)  
✅ Deployed Temporal workers  
✅ Load balancer with SSL/TLS  
✅ Monitoring and logging  
✅ Secrets management  

**Your team can now collaborate on a production-grade cloud environment!** 🎉

---

**Estimated Total Time**: ~60 minutes  
**Estimated Monthly Cost**: $900-$2,200 (depending on usage)  
**Last Updated**: February 25, 2026
