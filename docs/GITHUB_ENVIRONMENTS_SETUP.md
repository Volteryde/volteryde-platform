# GitHub Environments Setup Guide

## Overview

This guide provides instructions for setting up GitHub Environments for the Volteryde Platform with proper protection rules and secrets configuration.

## Required Environments

You need to create **4 environments** in your GitHub repository:

1. **development** - For dev deployments
2. **staging** - For staging deployments  
3. **production** - For production deployments
4. **production-approval** - For production approval gate

---

## Step-by-Step Setup

### 1. Access GitHub Environments

1. Go to your GitHub repository
2. Click **Settings** → **Environments**
3. Click **New environment**

### 2. Create Development Environment

**Environment Name:** `development`

**Configuration:**
- ✅ **Deployment branches:** `develop` branch only
- ❌ **Required reviewers:** None (auto-deploy)
- ❌ **Wait timer:** None
- ✅ **Environment secrets:** Configure secrets below

**Environment Secrets:**
```
AWS_ACCESS_KEY_ID_DEV=<your-dev-access-key>
AWS_SECRET_ACCESS_KEY_DEV=<your-dev-secret-key>
AWS_ACCOUNT_ID=776127042419
AWS_REGION=us-east-1
DEV_DATABASE_HOST=<dev-rds-endpoint>
DEV_DATABASE_PASSWORD=<dev-db-password>
DEV_REDIS_HOST=<dev-redis-endpoint>
DEV_JWT_SECRET=<dev-jwt-secret>
TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2
TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233
TEMPORAL_API_KEY=<your-temporal-api-key>
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
```

**Environment URL:** `https://dev-api.volteryde.com`

---

### 3. Create Staging Environment

**Environment Name:** `staging`

**Configuration:**
- ✅ **Deployment branches:** `staging` branch only
- ❌ **Required reviewers:** None (auto-deploy from staging branch)
- ⏱️ **Wait timer:** Optional - 5 minutes (to allow review)
- ✅ **Environment secrets:** Configure secrets below

**Environment Secrets:**
```
AWS_ACCESS_KEY_ID_STAGING=<your-staging-access-key>
AWS_SECRET_ACCESS_KEY_STAGING=<your-staging-secret-key>
AWS_ACCOUNT_ID=776127042419
AWS_REGION=us-east-1
STAGING_DATABASE_HOST=<staging-rds-endpoint>
STAGING_DATABASE_PASSWORD=<staging-db-password>
STAGING_REDIS_HOST=<staging-redis-endpoint>
STAGING_JWT_SECRET=<staging-jwt-secret>
TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2
TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233
TEMPORAL_API_KEY=<your-temporal-api-key>
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
```

**Environment URL:** `https://staging-api.volteryde.com`

---

### 4. Create Production Approval Environment

**Environment Name:** `production-approval`

**Configuration:**
- ✅ **Deployment branches:** `main` branch only
- ✅ **Required reviewers:** Add 1-2 senior team members
- ❌ **Wait timer:** None
- ❌ **Environment secrets:** None needed (approval gate only)

**Purpose:** This environment acts as a manual approval gate before production deployment.

**Environment URL:** `https://api.volteryde.com`

---

### 5. Create Production Environment

**Environment Name:** `production`

**Configuration:**
- ✅ **Deployment branches:** `main` branch only
- ✅ **Required reviewers:** Add 1-2 senior team members (if not using approval gate)
- ⏱️ **Wait timer:** Optional - 10 minutes
- ✅ **Environment secrets:** Configure secrets below
- ✅ **Prevent self-review:** Enabled

**Environment Secrets:**
```
AWS_ACCESS_KEY_ID_PROD=<your-prod-access-key>
AWS_SECRET_ACCESS_KEY_PROD=<your-prod-secret-key>
AWS_ACCOUNT_ID=776127042419
AWS_REGION=us-east-1
PROD_DATABASE_HOST=<prod-rds-endpoint>
PROD_DATABASE_PASSWORD=<prod-db-password>
PROD_REDIS_HOST=<prod-redis-endpoint>
PROD_JWT_SECRET=<prod-jwt-secret>
TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2
TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233
TEMPORAL_API_KEY=<your-temporal-api-key>
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
```

**Environment URL:** `https://api.volteryde.com`

---

## Repository-Level Secrets

In addition to environment-specific secrets, add these at the repository level (Settings → Secrets and variables → Actions):

```
AWS_ACCOUNT_ID=776127042419
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
TEMPORAL_NAMESPACE=quickstart-volteryde.svqe2
TEMPORAL_ADDRESS=sa-east-1.aws.api.temporal.io:7233
TEMPORAL_API_KEY=<your-temporal-api-key>
```

---

## Environment Protection Rules Summary

| Environment | Branch | Reviewers | Wait Timer | Auto-Deploy |
|-------------|--------|-----------|------------|-------------|
| **development** | `develop` | None | None | ✅ Yes |
| **staging** | `staging` | None | 5 min (optional) | ✅ Yes |
| **production-approval** | `main` | 1-2 required | None | ❌ Manual |
| **production** | `main` | 1-2 required | 10 min (optional) | ❌ Manual |

---

## Deployment Flow

### Development
```
Push to develop → Auto-deploy to development environment
```

### Staging
```
Push to staging → Auto-deploy to staging environment
```

### Production
```
Push to main → Manual approval (production-approval) → Deploy to production
```

---

## Workflow-Environment Mapping

| Workflow | Environment(s) Used |
|----------|-------------------|
| `deploy-dev.yml` | `development` |
| `deploy-dev-enhanced.yml` | `development` |
| `deploy-staging.yml` | `staging` |
| `deploy-staging-enhanced.yml` | `staging` |
| `deploy-production.yml` | `production` |
| `deploy-production-enhanced.yml` | `production-approval`, `production` |
| `terraform-apply.yml` | `development`, `staging`, `production` |

---

## Security Best Practices

### 1. Secrets Management
- ✅ Never commit secrets to the repository
- ✅ Use different credentials for each environment
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use AWS Secrets Manager for sensitive data
- ✅ Limit secret access to necessary workflows only

### 2. Access Control
- ✅ Require code reviews before merging to `main`
- ✅ Protect `main`, `staging`, and `develop` branches
- ✅ Use CODEOWNERS file for critical paths
- ✅ Enable branch protection rules
- ✅ Require status checks to pass

### 3. Deployment Safety
- ✅ Use manual approval for production
- ✅ Implement rollback mechanisms
- ✅ Monitor deployments with CloudWatch
- ✅ Set up Slack notifications
- ✅ Use blue-green deployment for production

### 4. Audit & Compliance
- ✅ Enable audit logs for environment access
- ✅ Review deployment history regularly
- ✅ Document all production changes
- ✅ Maintain deployment runbooks

---

## Branch Protection Rules

Configure these rules for each branch:

### `main` Branch
- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches
- ✅ Require deployments to succeed before merging

### `staging` Branch
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Allow force pushes (for hotfixes)

### `develop` Branch
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ❌ Do not require branches to be up to date (faster iteration)

---

## Verification Steps

After setting up environments, verify:

1. **Check Environment Configuration**
   ```bash
   # Go to Settings → Environments
   # Verify all 4 environments exist
   # Verify protection rules are set
   ```

2. **Test Development Deployment**
   ```bash
   git checkout develop
   git push origin develop
   # Should trigger auto-deployment to development
   ```

3. **Test Staging Deployment**
   ```bash
   git checkout staging
   git push origin staging
   # Should trigger auto-deployment to staging
   ```

4. **Test Production Approval**
   ```bash
   git checkout main
   git push origin main
   # Should require manual approval before deploying
   ```

---

## Troubleshooting

### Issue: Workflow fails with "Environment not found"
**Solution:** Create the environment in GitHub Settings → Environments

### Issue: Workflow fails with "Secret not found"
**Solution:** Add the required secret to the environment or repository secrets

### Issue: Deployment stuck on approval
**Solution:** Check if reviewers are configured and have been notified

### Issue: Wrong environment deployed
**Solution:** Verify branch protection rules and deployment branch settings

---

## Additional Resources

- [GitHub Environments Documentation](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## Summary Checklist

Before going live, ensure:

- [ ] All 4 environments created (development, staging, production-approval, production)
- [ ] Environment secrets configured for each environment
- [ ] Repository-level secrets added
- [ ] Branch protection rules enabled
- [ ] Required reviewers assigned for production
- [ ] Deployment branches configured correctly
- [ ] Slack webhook URL configured
- [ ] AWS credentials tested and working
- [ ] Temporal Cloud credentials configured
- [ ] All workflows tested in each environment

---

**Last Updated:** 2026-02-27  
**Status:** Ready for Implementation ✅
