# Production-Grade CI/CD Pipeline - Deployment Guide

## 🎯 Overview

This document describes the complete CI/CD pipeline for the Volteryde Platform, covering automated deployments across three isolated environments: Development, Staging, and Production.

---

## 🏗️ Architecture Overview

### **Environment Isolation**

```
┌─────────────────────────────────────────────────────────────────┐
│                     AWS ORGANIZATION                             │
│  ┌────────────────┬────────────────┬─────────────────────────┐  │
│  │  DEV ACCOUNT   │ STAGING ACCOUNT│  PRODUCTION ACCOUNT     │  │
│  │  (Isolated)    │  (Isolated)    │  (Isolated + Hardened)  │  │
│  └────────────────┴────────────────┴─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### **Deployment Flow**

```
Feature Branch
    ↓
    CI Only (Lint, Test, Build)
    ↓
Merge to develop
    ↓
    CI + Auto Deploy to DEV
    ↓
Merge to staging
    ↓
    CI + Auto Deploy to STAGING + Integration Tests
    ↓
Merge to main
    ↓
    CI + Manual Approval + Blue-Green Deploy to PROD
```

---

## 🌳 Branching Strategy

### **Branch Structure**

- `main` - Production branch (protected, requires approval)
- `staging` - Staging branch (protected, requires PR approval)
- `develop` - Development branch (protected, requires PR approval)
- `feature/*` - Feature branches (no restrictions)

### **Branch Protection Rules**

#### Main (Production)
- ✅ Require pull request reviews (2 approvers)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Require signed commits
- ❌ No direct pushes allowed
- ✅ Require manual deployment approval

#### Staging
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ No direct pushes allowed

#### Develop
- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks to pass
- ❌ No direct pushes allowed

---

## 🔐 Required GitHub Secrets

### **Development Environment**
```
AWS_ACCESS_KEY_ID_DEV
AWS_SECRET_ACCESS_KEY_DEV
DEV_DATABASE_HOST
DEV_DATABASE_PASSWORD
DEV_REDIS_HOST
DEV_JWT_SECRET
```

### **Staging Environment**
```
AWS_ACCESS_KEY_ID_STAGING
AWS_SECRET_ACCESS_KEY_STAGING
STAGING_DATABASE_HOST
STAGING_DATABASE_PASSWORD
STAGING_REDIS_HOST
STAGING_JWT_SECRET
```

### **Production Environment**
```
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
PROD_DATABASE_HOST
PROD_DATABASE_PASSWORD
PROD_REDIS_HOST
PROD_JWT_SECRET
PROD_BACKUP_BUCKET
```

### **Shared Secrets**
```
AWS_ACCOUNT_ID
GITGUARDIAN_API_KEY
CODECOV_TOKEN
SLACK_WEBHOOK_URL
TEMPORAL_NAMESPACE
TEMPORAL_ADDRESS
```

---

## 📋 Deployment Workflows

### **1. Comprehensive CI Pipeline**

**File**: `.github/workflows/ci-comprehensive.yml`

**Triggers**:
- Pull requests to `develop`, `staging`, `main`
- Pushes to `develop`, `staging`, `main`

**Quality Gates**:
1. **Security Scan** - GitGuardian + Trivy (blocks on critical issues)
2. **NestJS Quality Gate** - Lint, test, build, coverage
3. **Spring Boot Quality Gate** - Maven build, JUnit tests, JaCoCo coverage
4. **Temporal Workers Quality Gate** - Build and test
5. **Frontend Quality Gate** - Lint, type check, build for all 6 apps

**Failure Handling**:
- Any quality gate failure blocks deployment
- Slack notifications sent on failure
- PR checks marked as failed

---

### **2. Development Deployment**

**File**: `.github/workflows/deploy-dev-enhanced.yml`

**Triggers**:
- Push to `develop` branch
- Manual workflow dispatch

**Process**:
1. Build Docker images (NestJS, Spring Boot, Temporal Workers)
2. Push to ECR with tags: `{SHA}`, `dev-latest`
3. Deploy to EKS cluster `volteryde-dev`
4. Rolling update deployment
5. Health checks and smoke tests
6. CloudWatch metrics tagging

**Rollback**:
- Automatic rollback on deployment failure
- Uses Kubernetes `rollout undo`

**Notifications**:
- Slack notification on success/failure

---

### **3. Staging Deployment**

**File**: `.github/workflows/deploy-staging-enhanced.yml`

**Triggers**:
- Push to `staging` branch
- Manual workflow dispatch

**Process**:
1. Build Docker images with staging configuration
2. Push to ECR with tags: `{SHA}`, `staging-latest`
3. Create deployment backup (retained for 30 days)
4. Deploy to EKS cluster `volteryde-staging`
5. Rolling update deployment
6. Comprehensive health checks
7. Integration tests
8. Performance baseline tests (k6)
9. 2-minute metrics monitoring

**Rollback**:
- Automatic rollback on failure
- Backup artifacts uploaded to S3

**Notifications**:
- Slack notification with test results

---

### **4. Production Deployment (Blue-Green)**

**File**: `.github/workflows/deploy-production-enhanced.yml`

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch (with confirmation)

**Process**:
1. **Validation Gate**
   - Verify confirmation text: "DEPLOY TO PRODUCTION"
   - Verify images exist in ECR
   - Check image vulnerability scans

2. **Manual Approval Gate**
   - Requires approval in GitHub Actions UI
   - Environment: `production-approval`

3. **Pre-Deployment Backup**
   - Backup all Kubernetes resources
   - Upload to S3 (90-day retention)
   - Upload to GitHub artifacts

4. **Blue-Green Deployment**
   - Deploy GREEN version of NestJS service
   - Health checks
   - Deploy GREEN version of Spring Boot service
   - Health checks
   - Deploy GREEN version of Temporal Workers
   - Production smoke tests
   - 5-minute metrics monitoring

5. **Post-Deployment**
   - Tag deployment in CloudWatch
   - Mark images as immutable
   - Success notification

**Rollback**:
- Emergency rollback on any failure
- Automatic execution
- Incident ticket creation
- Critical Slack notification

---

## 🚀 Deployment Commands

### **Deploy to Development**
```bash
# Automatic on merge to develop
git checkout develop
git merge feature/my-feature
git push origin develop
```

### **Deploy to Staging**
```bash
# Automatic on merge to staging
git checkout staging
git merge develop
git push origin staging
```

### **Deploy to Production**
```bash
# Method 1: Automatic on merge to main
git checkout main
git merge staging
git push origin main

# Method 2: Manual workflow dispatch
# Go to GitHub Actions → Deploy to Production → Run workflow
# Enter image tag (SHA from staging)
# Type "DEPLOY TO PRODUCTION" to confirm
# Approve in GitHub UI
```

---

## 🔄 Rollback Procedures

### **Development/Staging - Automatic Rollback**
Rollback is automatic on deployment failure. No manual intervention required.

### **Production - Manual Rollback**

#### **Option 1: Kubernetes Rollback**
```bash
# Configure kubectl for production
aws eks update-kubeconfig --region us-east-1 --name volteryde-production

# Rollback specific service
kubectl rollout undo deployment/nestjs-service -n volteryde-prod
kubectl rollout undo deployment/springboot-service -n volteryde-prod
kubectl rollout undo deployment/temporal-workers -n volteryde-prod

# Verify rollback
kubectl rollout status deployment/nestjs-service -n volteryde-prod
```

#### **Option 2: Restore from Backup**
```bash
# Download backup from S3
aws s3 cp s3://${BACKUP_BUCKET}/deployments/${TIMESTAMP}/ ./backup/ --recursive

# Apply backup
kubectl apply -f backup/backup-deployments-${TIMESTAMP}.yaml
```

#### **Option 3: Redeploy Previous Version**
```bash
# Trigger workflow dispatch with previous image tag
# Go to GitHub Actions → Deploy to Production
# Enter previous working SHA
# Complete approval process
```

---

## 📊 Monitoring & Alerting

### **CloudWatch Metrics**

**Deployment Metrics**:
- `Volteryde/Deployments/DeploymentCount`
- `Volteryde/Deployments/ProductionDeployment`

**Application Metrics**:
- CPU Utilization
- Memory Usage
- Request Count
- Error Rate
- Response Time

### **CloudWatch Alarms**

**RDS Alarms**:
- High CPU (>80%)
- Low Storage (<10GB)
- High Connections
- Replication Lag

**EKS Alarms**:
- Pod Crash Loop
- Node Not Ready
- High Memory Pressure

### **Slack Notifications**

All deployments send Slack notifications:
- ✅ Success: Green message with deployment details
- ❌ Failure: Red message with error details and action items
- 🔄 Rollback: Yellow message with rollback confirmation

---

## 🔒 Security Best Practices

### **1. Secret Management**
- ✅ All secrets stored in GitHub Secrets
- ✅ Production secrets in AWS Secrets Manager
- ✅ Automatic secret rotation enabled
- ✅ No secrets in code or logs

### **2. IAM Role Separation**
- ✅ Separate IAM roles per environment
- ✅ Least privilege principle
- ✅ No shared credentials between environments

### **3. Network Security**
- ✅ Private subnets for EKS nodes
- ✅ Security groups with minimal access
- ✅ Production API not publicly accessible
- ✅ WAF enabled for production ALB

### **4. Image Security**
- ✅ ECR image scanning enabled
- ✅ Vulnerability checks before deployment
- ✅ Immutable tags for production images
- ✅ Regular base image updates

---

## 🧪 Testing Strategy

### **CI Pipeline Tests**
1. **Unit Tests** - Jest (NestJS), JUnit (Java)
2. **Integration Tests** - E2E tests with test database
3. **Security Tests** - GitGuardian, Trivy, OWASP
4. **Code Coverage** - Minimum 70% coverage

### **Staging Tests**
1. **Integration Tests** - Full API integration tests
2. **Performance Tests** - k6 load testing
3. **Smoke Tests** - Critical path verification

### **Production Tests**
1. **Smoke Tests** - Health checks and critical endpoints
2. **Canary Tests** - Gradual traffic shifting (future)
3. **Synthetic Monitoring** - Continuous health checks

---

## 📈 Performance Optimization

### **Build Optimization**
- ✅ Docker layer caching (GitHub Actions cache)
- ✅ Multi-stage Docker builds
- ✅ Parallel job execution
- ✅ Conditional job execution (path filters)

### **Deployment Optimization**
- ✅ Rolling updates (zero downtime)
- ✅ Blue-green deployment for production
- ✅ Resource limits and requests configured
- ✅ Horizontal Pod Autoscaling (HPA)

---

## 🆘 Troubleshooting

### **Deployment Fails at Build Stage**
```bash
# Check build logs
gh run view <run-id> --log

# Rebuild locally
docker build -t test-image -f services/volteryde-nest/Dockerfile.prod services/volteryde-nest
```

### **Deployment Fails at Rollout**
```bash
# Check pod status
kubectl get pods -n volteryde-{env}

# Check pod logs
kubectl logs -n volteryde-{env} <pod-name>

# Describe pod for events
kubectl describe pod -n volteryde-{env} <pod-name>
```

### **Health Checks Fail**
```bash
# Check service endpoints
kubectl get svc -n volteryde-{env}

# Test health endpoint
kubectl exec -n volteryde-{env} <pod-name> -- curl localhost:3000/health

# Check application logs
kubectl logs -n volteryde-{env} -l app=nestjs-service --tail=100
```

### **Rollback Fails**
```bash
# Check rollout history
kubectl rollout history deployment/nestjs-service -n volteryde-{env}

# Rollback to specific revision
kubectl rollout undo deployment/nestjs-service -n volteryde-{env} --to-revision=<revision>

# Force delete and recreate
kubectl delete deployment nestjs-service -n volteryde-{env}
kubectl apply -f backup/backup-deployments.yaml
```

---

## 📞 Support & Escalation

### **Deployment Issues**
1. Check GitHub Actions logs
2. Check Slack notifications
3. Review CloudWatch metrics
4. Contact DevOps team

### **Production Incidents**
1. Trigger emergency rollback
2. Create incident ticket
3. Notify on-call engineer
4. Follow incident response runbook

### **Escalation Path**
1. **L1**: DevOps Engineer
2. **L2**: Senior DevOps Engineer
3. **L3**: Platform Architect
4. **L4**: CTO

---

## 📚 Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Temporal Documentation](https://docs.temporal.io/)

---

## 🔄 Continuous Improvement

### **Planned Enhancements**
- [ ] Canary deployments for production
- [ ] Automated performance regression testing
- [ ] GitOps with ArgoCD
- [ ] Multi-region deployment
- [ ] Chaos engineering tests

### **Metrics to Track**
- Deployment frequency
- Lead time for changes
- Mean time to recovery (MTTR)
- Change failure rate
- Deployment success rate

---

**Last Updated**: 2026-02-27  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
