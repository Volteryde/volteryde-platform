# AWS Infrastructure Setup - Completed

## ✅ AWS CLI Configuration

**AWS Account:** 776127042419  
**IAM User:** volteryde  
**Default Region:** sa-east-1  
**Deployment Region:** us-east-1

### Credentials Status
- ✅ AWS CLI installed (v2.33.29)
- ✅ Access keys configured
- ✅ Region configured
- ✅ IAM user verified

## ✅ ECR Repositories Created

All Docker image repositories have been created in **us-east-1** with the following configurations:

### 1. NestJS Service
- **Repository Name:** `volteryde/nestjs-service`
- **URI:** `776127042419.dkr.ecr.us-east-1.amazonaws.com/volteryde/nestjs-service`
- **ARN:** `arn:aws:ecr:us-east-1:776127042419:repository/volteryde/nestjs-service`
- **Image Scanning:** Enabled (scanOnPush)
- **Encryption:** AES256
- **Lifecycle Policy:** Keep last 10 images
- **Created:** 2026-02-27

### 2. Spring Boot Service
- **Repository Name:** `volteryde/springboot-service`
- **URI:** `776127042419.dkr.ecr.us-east-1.amazonaws.com/volteryde/springboot-service`
- **ARN:** `arn:aws:ecr:us-east-1:776127042419:repository/volteryde/springboot-service`
- **Image Scanning:** Enabled (scanOnPush)
- **Encryption:** AES256
- **Lifecycle Policy:** Keep last 10 images
- **Created:** 2026-02-27

### 3. Temporal Workers
- **Repository Name:** `volteryde/temporal-workers`
- **URI:** `776127042419.dkr.ecr.us-east-1.amazonaws.com/volteryde/temporal-workers`
- **ARN:** `arn:aws:ecr:us-east-1:776127042419:repository/volteryde/temporal-workers`
- **Image Scanning:** Enabled (scanOnPush)
- **Encryption:** AES256
- **Lifecycle Policy:** Keep last 10 images
- **Created:** 2026-02-27

## 📋 Next Steps

### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
# AWS Credentials for Development
AWS_ACCESS_KEY_ID_DEV=<your-dev-access-key>
AWS_SECRET_ACCESS_KEY_DEV=<your-dev-secret-key>

# AWS Credentials for Staging
AWS_ACCESS_KEY_ID_STAGING=<your-staging-access-key>
AWS_SECRET_ACCESS_KEY_STAGING=<your-staging-secret-key>

# AWS Credentials for Production
AWS_ACCESS_KEY_ID_PROD=<your-prod-access-key>
AWS_SECRET_ACCESS_KEY_PROD=<your-prod-secret-key>

# ECR Registry
AWS_ACCOUNT_ID=776127042419
AWS_REGION=us-east-1

# Slack Notifications (optional)
SLACK_WEBHOOK_URL=<your-slack-webhook-url>

# Database Credentials (per environment)
DEV_DATABASE_HOST=<dev-rds-endpoint>
DEV_DATABASE_PASSWORD=<dev-db-password>
STAGING_DATABASE_HOST=<staging-rds-endpoint>
STAGING_DATABASE_PASSWORD=<staging-db-password>
PROD_DATABASE_HOST=<prod-rds-endpoint>
PROD_DATABASE_PASSWORD=<prod-db-password>

# Redis Endpoints (per environment)
DEV_REDIS_HOST=<dev-redis-endpoint>
STAGING_REDIS_HOST=<staging-redis-endpoint>
PROD_REDIS_HOST=<prod-redis-endpoint>

# JWT Secrets (per environment)
DEV_JWT_SECRET=<dev-jwt-secret>
STAGING_JWT_SECRET=<staging-jwt-secret>
PROD_JWT_SECRET=<prod-jwt-secret>

# Temporal Cloud
TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2
TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233
TEMPORAL_API_KEY=<your-temporal-api-key>
```

### 2. Create EKS Clusters

You need to create EKS clusters for each environment:

```bash
# Development
eksctl create cluster \
  --name volteryde-dev \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed

# Staging
eksctl create cluster \
  --name volteryde-staging \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed

# Production
eksctl create cluster \
  --name volteryde-production \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

### 3. Create RDS Instances

Create PostgreSQL RDS instances for each environment:

```bash
# Development
aws rds create-db-instance \
  --db-instance-identifier volteryde-dev-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --region us-east-1

# Staging
aws rds create-db-instance \
  --db-instance-identifier volteryde-staging-db \
  --db-instance-class db.t3.small \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 50 \
  --multi-az \
  --region us-east-1

# Production
aws rds create-db-instance \
  --db-instance-identifier volteryde-prod-db \
  --db-instance-class db.r6g.large \
  --engine postgres \
  --engine-version 15.4 \
  --master-username postgres \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --multi-az \
  --backup-retention-period 7 \
  --region us-east-1
```

### 4. Create ElastiCache Redis Clusters

```bash
# Development
aws elasticache create-cache-cluster \
  --cache-cluster-id volteryde-dev-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --region us-east-1

# Staging
aws elasticache create-replication-group \
  --replication-group-id volteryde-staging-redis \
  --replication-group-description "Staging Redis" \
  --cache-node-type cache.t3.small \
  --engine redis \
  --num-cache-clusters 2 \
  --region us-east-1

# Production
aws elasticache create-replication-group \
  --replication-group-id volteryde-prod-redis \
  --replication-group-description "Production Redis" \
  --cache-node-type cache.r6g.large \
  --engine redis \
  --num-cache-clusters 3 \
  --automatic-failover-enabled \
  --region us-east-1
```

### 5. Configure kubectl for EKS

After creating EKS clusters:

```bash
# Development
aws eks update-kubeconfig --name volteryde-dev --region us-east-1

# Staging
aws eks update-kubeconfig --name volteryde-staging --region us-east-1

# Production
aws eks update-kubeconfig --name volteryde-production --region us-east-1
```

### 6. Deploy Kubernetes Resources

```bash
# Create namespaces
kubectl create namespace volteryde-dev
kubectl create namespace volteryde-staging
kubectl create namespace volteryde-prod

# Apply base configurations
kubectl apply -f infrastructure/kubernetes/base/ -n volteryde-dev
kubectl apply -f infrastructure/kubernetes/base/ -n volteryde-staging
kubectl apply -f infrastructure/kubernetes/base/ -n volteryde-prod
```

## 🔐 Security Recommendations

1. **IAM Roles:** Create separate IAM roles for each environment with least-privilege access
2. **Secrets Management:** Use AWS Secrets Manager for sensitive data
3. **Network Security:** Configure VPC, security groups, and NACLs properly
4. **Encryption:** Enable encryption at rest and in transit for all services
5. **Monitoring:** Set up CloudWatch alarms and logging
6. **Backup:** Configure automated backups for RDS and critical data

## 📊 Cost Optimization

1. **Use Reserved Instances** for production workloads
2. **Enable Auto Scaling** for EKS node groups
3. **Set up lifecycle policies** for ECR (already done - keeps last 10 images)
4. **Monitor unused resources** with AWS Cost Explorer
5. **Use Spot Instances** for non-critical dev/staging workloads

## 🔍 Monitoring & Logging

Set up the following:

1. **CloudWatch Logs** for application logs
2. **CloudWatch Metrics** for performance monitoring
3. **AWS X-Ray** for distributed tracing
4. **CloudWatch Alarms** for critical metrics
5. **SNS Topics** for alert notifications

## ✅ Verification Commands

```bash
# Verify ECR repositories
aws ecr describe-repositories --region us-east-1

# Verify EKS clusters (after creation)
aws eks list-clusters --region us-east-1

# Verify RDS instances (after creation)
aws rds describe-db-instances --region us-east-1

# Verify ElastiCache clusters (after creation)
aws elasticache describe-cache-clusters --region us-east-1

# Test Docker push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 776127042419.dkr.ecr.us-east-1.amazonaws.com
```

## 📝 Notes

- All ECR repositories are configured with image scanning on push
- Lifecycle policies automatically clean up old images (keeps last 10)
- Repositories use AES256 encryption
- Default region is `sa-east-1` but deployment region is `us-east-1`
- GitHub Actions workflows are configured to use these repositories

---

**Last Updated:** 2026-02-27  
**AWS Account:** 776127042419  
**Setup Status:** ECR Complete ✅ | EKS Pending ⏳ | RDS Pending ⏳ | ElastiCache Pending ⏳
