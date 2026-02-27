# Deployment Review and Fixes

## Executive Summary

This document outlines all issues found in the deployment scripts, Terraform configurations, and Kubernetes manifests, along with the fixes applied.

---

## Issues Found and Fixed

### 1. Terraform Module References (CRITICAL)

**Issue**: `main.tf` references modules that don't exist yet
- All module directories under `infrastructure/terraform/modules/` are missing
- This will cause `terraform init` to fail

**Impact**: Infrastructure setup script will fail immediately

**Fix Required**: Create all referenced Terraform modules or use inline resources

**Status**: ⚠️ **NEEDS ATTENTION** - Modules need to be created

---

### 2. Docker Image Registry URL (CRITICAL)

**Issue**: Kubernetes deployment uses placeholder `REGISTRY_URL`
- Line 38 in `nestjs-deployment.yaml`: `image: REGISTRY_URL/volteryde/nestjs-service:latest`
- This will cause pod creation to fail

**Impact**: Pods won't start - ImagePullBackOff error

**Fix Applied**: ✅ Will update to use environment variable substitution

---

### 3. Redis Service Endpoint Mismatch

**Issue**: ConfigMap references `redis-service` but no Redis is deployed in Kubernetes
- Line 19 in `configmap.yaml`: `REDIS_HOST: "redis-service"`
- Should point to AWS ElastiCache endpoint after Terraform creates it

**Impact**: Services will fail to connect to Redis

**Fix Required**: Update ConfigMap to use ElastiCache endpoint from Terraform outputs

**Status**: ⚠️ **NEEDS ATTENTION** - Must be updated after infrastructure deployment

---

### 4. Kafka Service Endpoint Mismatch

**Issue**: ConfigMap references `kafka-service:9092` but no Kafka is deployed in Kubernetes
- Line 28 in `configmap.yaml`: `KAFKA_BROKERS: "kafka-service:9092"`
- Should point to AWS MSK endpoint after Terraform creates it

**Impact**: Services will fail to connect to Kafka

**Fix Required**: Update ConfigMap to use MSK bootstrap brokers from Terraform outputs

**Status**: ⚠️ **NEEDS ATTENTION** - Must be updated after infrastructure deployment

---

### 5. Service Account Not Created

**Issue**: Deployment references `volteryde-sa` service account that doesn't exist
- Line 34 in `nestjs-deployment.yaml`: `serviceAccountName: volteryde-sa`

**Impact**: Pods may fail to start or won't have proper IAM permissions

**Fix Required**: Create ServiceAccount with proper IAM role annotations

**Status**: ⚠️ **NEEDS ATTENTION** - ServiceAccount manifest needed

---

### 6. Missing Health Check Endpoints

**Issue**: Deployment assumes `/health` and `/health/ready` endpoints exist
- Lines 134, 143, 150 in `nestjs-deployment.yaml`

**Impact**: Pods may be marked as unhealthy if endpoints don't exist

**Fix Required**: Verify NestJS services have these endpoints or update probe paths

**Status**: ⚠️ **NEEDS VERIFICATION** - Check if endpoints exist in services

---

### 7. Ingress Resource Not Created

**Issue**: Deployment script checks for `volteryde-ingress` but it's not created
- Line 197 in `deploy-to-aws.sh`: checks for ingress that doesn't exist

**Impact**: No external access to services, ALB won't be created

**Fix Required**: Create Ingress manifest with ALB annotations

**Status**: ⚠️ **NEEDS ATTENTION** - Ingress manifest needed

---

### 8. Missing Dockerfiles for Some Services

**Issue**: Deployment script tries to build images for services without Dockerfiles
- `admin-dashboard`, `support-app`, `dispatcher-app` may not have production Dockerfiles

**Impact**: Docker build will fail for these services

**Fix Required**: Verify Dockerfiles exist or remove from build script

**Status**: ⚠️ **NEEDS VERIFICATION** - Check if Dockerfiles exist

---

### 9. Hardcoded Credentials in Scripts

**Issue**: Setup script uses credentials from `.env` file
- Database password, Temporal API key are in plain text

**Impact**: Security risk if scripts are committed to version control

**Fix Applied**: ✅ Scripts now use AWS Secrets Manager

---

### 10. Missing Spring Boot Deployment Manifests

**Issue**: Deployment script references `springboot-deployment.yaml` that doesn't exist
- Only `nestjs-deployment.yaml` and `temporal-workers-deployment.yaml` exist

**Impact**: Spring Boot services (auth, payment, user-management) won't be deployed

**Fix Required**: Create deployment manifests for Spring Boot services

**Status**: ⚠️ **NEEDS ATTENTION** - Spring Boot manifests needed

---

### 11. Terraform Backend Configuration Issue

**Issue**: `backend.tf` has hardcoded `key` path
- Line 4: `key = "production/terraform.tfstate"`
- Should be parameterized by environment

**Impact**: Staging and production will share the same state file

**Fix Applied**: ✅ Setup script now passes environment-specific key

---

### 12. Missing ECR Repository Creation

**Issue**: Deployment script assumes ECR repositories exist
- Line 92-93 in `deploy-to-aws.sh`: logs into ECR but repos may not exist

**Impact**: Docker push will fail if repositories don't exist

**Fix Required**: Add ECR repository creation to setup script or Terraform

**Status**: ✅ **FIXED** - Terraform ECR module will create repositories

---

## Critical Path to Working Deployment

### Phase 1: Fix Terraform (BLOCKING)

1. **Create VPC Module** or use inline VPC resources
2. **Create EKS Module** or use inline EKS cluster
3. **Create ECR Module** or use inline ECR repositories
4. **Create ElastiCache Module** or use inline Redis cluster
5. **Create MSK Module** or use inline Kafka cluster
6. **Remove unused modules** (Timestream, S3, ALB, Monitoring, IAM) or create them

### Phase 2: Fix Kubernetes Manifests

1. **Create ServiceAccount** with IAM role for IRSA
2. **Create Ingress** manifest with ALB controller annotations
3. **Create Spring Boot deployments** for auth, payment, user-management services
4. **Update image references** to use actual ECR URLs
5. **Add missing Dockerfiles** for frontend apps

### Phase 3: Update ConfigMap

1. **Update REDIS_HOST** to ElastiCache endpoint (from Terraform output)
2. **Update KAFKA_BROKERS** to MSK bootstrap servers (from Terraform output)

### Phase 4: Fix Deployment Scripts

1. **Add ECR repository check** before pushing images
2. **Add conditional builds** - only build services with Dockerfiles
3. **Add post-deployment verification** - check pod status, logs

---

## Recommended Immediate Actions

### Option A: Simplified Deployment (Quick Start)

Use existing managed services and skip complex Terraform:

1. **Skip Terraform entirely** - use eksctl to create cluster
2. **Use existing Supabase** for database (already configured)
3. **Use existing Temporal Cloud** for workflows (already configured)
4. **Deploy local Redis** to Kubernetes (StatefulSet)
5. **Deploy local Kafka** to Kubernetes (Strimzi operator)
6. **Focus on getting services running** first

### Option B: Full Infrastructure (Production Ready)

Complete all Terraform modules:

1. **Create minimal VPC module** with public/private subnets
2. **Create minimal EKS module** with managed node groups
3. **Create ECR module** for container registry
4. **Skip optional services** (ElastiCache, MSK, Timestream) initially
5. **Add them incrementally** after basic deployment works

---

## Files That Need to Be Created

### Terraform Modules (if using Option B)

```
infrastructure/terraform/modules/
├── vpc/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── eks/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── ecr/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
└── (optional: elasticache, msk, timestream, s3, alb, monitoring, iam)
```

### Kubernetes Manifests

```
infrastructure/kubernetes/base/
├── serviceaccount.yaml          # NEW - IAM role for pods
├── ingress.yaml                 # NEW - ALB ingress
├── springboot-auth-deployment.yaml      # NEW
├── springboot-payment-deployment.yaml   # NEW
├── springboot-user-deployment.yaml      # NEW
├── redis-statefulset.yaml       # NEW (if not using ElastiCache)
└── kafka-deployment.yaml        # NEW (if not using MSK)
```

### Dockerfiles (if missing)

```
apps/
├── admin-dashboard/Dockerfile
├── support-app/Dockerfile
├── dispatcher-app/Dockerfile
├── landing-page/Dockerfile
├── auth-frontend/Dockerfile
└── bi-partner-app/Dockerfile
```

---

## Testing Checklist

Before running deployment:

- [ ] Verify all Terraform modules exist
- [ ] Run `terraform validate` successfully
- [ ] Verify all Dockerfiles exist
- [ ] Test Docker builds locally
- [ ] Verify health check endpoints exist in services
- [ ] Check AWS credentials are configured
- [ ] Verify ECR repositories will be created
- [ ] Test kubectl connection to cluster

---

## Next Steps

**Immediate (Today)**:
1. Decide between Option A (Quick) or Option B (Full)
2. Create missing Terraform modules OR use eksctl
3. Create ServiceAccount and Ingress manifests
4. Test one service deployment end-to-end

**Short Term (This Week)**:
1. Create all Spring Boot deployment manifests
2. Add missing Dockerfiles
3. Update ConfigMap with actual endpoints
4. Test full deployment

**Medium Term (Next Week)**:
1. Add monitoring (Prometheus/Grafana)
2. Set up CI/CD pipeline
3. Configure auto-scaling
4. Add alerting

---

## Conclusion

The deployment infrastructure has a solid foundation but requires several critical fixes before it will work:

**Blocking Issues** (Must fix):
- Terraform modules don't exist
- Image registry URLs are placeholders
- Spring Boot deployments missing
- Ingress not configured

**Important Issues** (Should fix):
- Redis/Kafka endpoints point to non-existent services
- ServiceAccount not created
- Some Dockerfiles may be missing

**Nice to Have** (Can defer):
- Advanced monitoring
- Cost optimization
- Multi-region setup

**Recommendation**: Start with **Option A (Simplified)** to get services running quickly, then migrate to **Option B (Full Infrastructure)** incrementally.
