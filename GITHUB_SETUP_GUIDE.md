# 🚀 Volteryde Platform - Complete GitHub Setup Guide

**Repository**: https://github.com/VolteRyde/volteryde-platform

---

## ✅ Current Status

✓ Remote origin added: `git@github.com:VolteRyde/volteryde-platform.git`  
✓ Branches created and pushed:
- `main` - Production branch
- `develop` - Development/integration branch
- `staging` - Staging/pre-production branch

---

## 📋 Step-by-Step GitHub Configuration

### 1️⃣ Configure Branch Protection Rules

Go to: **Settings → Branches → Add branch protection rule**

#### **Protect `main` Branch (Production)**

**Branch name pattern**: `main`

**Required settings:**
- ☑️ **Require a pull request before merging**
  - ☑️ Require approvals: **2**
  - ☑️ Dismiss stale pull request approvals when new commits are pushed
  - ☑️ Require review from Code Owners
- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - **Required checks** (add these as they appear):
    - `CI - NestJS Backend Services`
    - `CI - Java Spring Boot Services`
    - `CI - Frontend Applications`
    - `Security Scan`
- ☑️ **Require conversation resolution before merging**
- ☑️ **Require signed commits** (optional but recommended)
- ☑️ **Do not allow bypassing the above settings**
- ☑️ **Restrict who can push to matching branches**
  - Add: Platform leads only

**Other settings:**
- ☑️ **Require linear history**
- ☑️ **Include administrators** (enforce rules for admins too)

---

#### **Protect `develop` Branch (Development)**

**Branch name pattern**: `develop`

**Required settings:**
- ☑️ **Require a pull request before merging**
  - ☑️ Require approvals: **1**
  - ☑️ Dismiss stale pull request approvals when new commits are pushed
- ☑️ **Require status checks to pass before merging**
  - ☑️ Require branches to be up to date before merging
  - **Required checks**:
    - `CI - NestJS Backend Services`
    - `CI - Java Spring Boot Services`
    - `CI - Frontend Applications`
- ☑️ **Require conversation resolution before merging**
- ☑️ **Do not allow bypassing the above settings**

---

#### **Protect `staging` Branch (Staging)**

**Branch name pattern**: `staging`

**Required settings:**
- ☑️ **Require a pull request before merging**
  - ☑️ Require approvals: **1**
- ☑️ **Require status checks to pass before merging**
  - **Required checks**:
    - `CI - NestJS Backend Services`
    - `CI - Java Spring Boot Services`
    - `CI - Frontend Applications`
- ☑️ **Require conversation resolution before merging**

---

### 2️⃣ Configure Repository Settings

#### **General Settings**
Go to: **Settings → General**

**Features:**
- ☑️ Issues
- ☑️ Projects
- ☑️ Wiki (optional)
- ☑️ Discussions (recommended for team communication)

**Pull Requests:**
- ☑️ Allow squash merging
- ☑️ Allow merge commits
- ☑️ Allow rebase merging
- ☑️ Always suggest updating pull request branches
- ☑️ Automatically delete head branches

**Merge button:**
- Default to: **Squash and merge** (for cleaner history)

---

### 3️⃣ Configure Required GitHub Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

#### **AWS Credentials**
```
AWS_ACCESS_KEY_ID
→ Your AWS access key for dev/staging

AWS_SECRET_ACCESS_KEY
→ Your AWS secret key for dev/staging

AWS_ACCESS_KEY_ID_PROD
→ Your AWS access key for production (separate account recommended)

AWS_SECRET_ACCESS_KEY_PROD
→ Your AWS secret key for production

AWS_ACCOUNT_ID
→ Your AWS account ID (12-digit number)
```

#### **Security & Code Quality**
```
SNYK_TOKEN
→ Get from: https://app.snyk.io/account
→ Used for: Dependency vulnerability scanning

SONAR_TOKEN
→ Get from: https://sonarcloud.io/account/security
→ Used for: Code quality analysis

CODECOV_TOKEN
→ Get from: https://app.codecov.io/ (after adding repository)
→ Used for: Test coverage tracking
```

#### **Notifications**
```
SLACK_WEBHOOK_URL
→ Create at: Slack workspace → Apps → Incoming Webhooks
→ Used for: Deployment and build notifications
```

#### **Optional (for paid features)**
```
GITLEAKS_LICENSE
→ Only if using Gitleaks paid version
→ Used for: Secret detection
```

---

### 4️⃣ Configure GitHub Environments

Go to: **Settings → Environments**

#### **Create Environment: `development`**
- **URL**: `https://dev-api.volteryde.com`
- **Protection rules**: None (auto-deploy)
- **Environment secrets**: None needed (uses repository secrets)

#### **Create Environment: `staging`**
- **URL**: `https://staging-api.volteryde.com`
- **Protection rules**: None (auto-deploy)
- **Environment secrets**: None needed

#### **Create Environment: `production`**
- **URL**: `https://api.volteryde.com`
- **Protection rules**:
  - ☑️ **Required reviewers**: Add platform leads (at least 2)
  - ☑️ **Wait timer**: 0 minutes (or add a delay if desired)
- **Environment secrets**: Uses `AWS_ACCESS_KEY_ID_PROD` and `AWS_SECRET_ACCESS_KEY_PROD`

---

### 5️⃣ Configure GitHub Teams (Recommended)

Go to: **Organization Settings → Teams** (if you have an organization)

Create these teams:
```
@volteryde/platform-leads       → CTO, Tech Lead
@volteryde/backend-team         → Backend developers
@volteryde/frontend-team        → Frontend developers
@volteryde/mobile-team          → Mobile developers
@volteryde/devops-team          → DevOps/Infrastructure team
@volteryde/security-team        → Security engineers
@volteryde/database-team        → Database administrators
@volteryde/qa-team              → QA/Testing team
```

**Then update `.github/CODEOWNERS`** with actual team handles.

---

### 6️⃣ Enable GitHub Security Features

#### **Dependabot**
Go to: **Settings → Code security and analysis**

Enable:
- ☑️ **Dependency graph**
- ☑️ **Dependabot alerts**
- ☑️ **Dependabot security updates**

#### **Code Scanning**
- ☑️ **CodeQL analysis** (already configured in workflows)
- ☑️ **Secret scanning**
- ☑️ **Secret scanning push protection**

---

### 7️⃣ Set Default Branch

Go to: **Settings → General → Default branch**

- Set to: **`develop`** (for active development)
- `main` will be your production branch (protected, only merged from staging)

---

## 🌳 Branch Strategy & Workflow

### **Branch Hierarchy**

```
main (production)
  ↑
staging (pre-production)
  ↑
develop (integration)
  ↑
feature/*, bugfix/*, hotfix/*
```

### **Development Workflow**

#### **1. Create Feature Branch**
```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

#### **2. Work on Feature**
```bash
# Make changes
git add .
git commit -m "feat: add awesome feature"

# Keep up to date with develop
git fetch origin
git rebase origin/develop

# Push to GitHub
git push origin feature/your-feature-name
```

#### **3. Create Pull Request**
- Go to GitHub
- Click "Compare & pull request"
- **Base branch**: `develop`
- **Compare branch**: `feature/your-feature-name`
- Fill out the PR template (mandatory 3 components: tests, UI, docs)
- Request reviews
- Wait for CI/CD checks to pass
- Address review feedback

#### **4. Merge to Develop**
- Once approved and checks pass
- Use "Squash and merge" (cleaner history)
- **Automatic deployment to DEV** will trigger

#### **5. Promote to Staging**
```bash
# Periodically merge develop → staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging
```
- **Automatic deployment to STAGING** will trigger

#### **6. Promote to Production**
```bash
# After thorough testing in staging
git checkout main
git pull origin main
git merge staging
git push origin main
```
- Then manually trigger **Deploy to Production** workflow
- Requires manual approval
- Type "DEPLOY TO PRODUCTION" to confirm

---

## 🚨 Hotfix Workflow (Emergency Production Fix)

```bash
# Branch from main for critical fixes
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make fix
git add .
git commit -m "fix: critical production bug"
git push origin hotfix/critical-bug-fix

# Create PR to main (expedited review)
# After merge, backport to develop and staging
git checkout develop
git merge main
git push origin develop

git checkout staging
git merge main
git push origin staging
```

---

## 📊 GitHub Actions Workflows Overview

All workflows are in `.github/workflows/`:

### **Continuous Integration (Automatic)**
- `ci-backend-nestjs.yml` - Triggers on NestJS changes
- `ci-backend-java.yml` - Triggers on Java changes
- `ci-frontend.yml` - Triggers on frontend changes
- `security-scan.yml` - Daily security scans

### **Docker & Infrastructure**
- `docker-build-push.yml` - Builds and pushes images to ECR
- `terraform-plan.yml` - Plans infrastructure on PRs
- `terraform-apply.yml` - Applies infrastructure (manual or on main push)

### **Deployments (Automatic except Production)**
- `deploy-dev.yml` - Auto-deploys `develop` → DEV environment
- `deploy-staging.yml` - Auto-deploys `staging` → STAGING environment
- `deploy-production.yml` - **Manual only** with approval

### **Automation**
- `pr-labeler.yml` - Auto-labels PRs

---

## 🎯 Day-to-Day Development Commands

### **Starting New Feature**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-feature
# ... work ...
git add .
git commit -m "feat: description"
git push origin feature/my-feature
# Create PR on GitHub
```

### **Updating Your Branch**
```bash
# Fetch latest changes
git fetch origin

# Rebase on develop
git rebase origin/develop

# If conflicts, resolve them
git rebase --continue

# Force push (since history changed)
git push origin feature/my-feature --force-with-lease
```

### **Before Creating PR**
```bash
# Ensure all tests pass locally
./scripts/test-all.sh

# Ensure code is clean
cd services/volteryde-nest && pnpm lint
cd services/volteryde-springboot && ./mvnw verify

# Build everything
./scripts/build-all.sh
```

---

## 📖 Pull Request Checklist

Before submitting any PR, ensure:

### ✅ Tests (REQUIRED)
- [ ] Unit tests written and passing
- [ ] Integration tests (if applicable)
- [ ] Test coverage acceptable

### ✅ UI Components (REQUIRED if user-facing)
- [ ] UI components implemented in relevant apps
- [ ] Form validation with Zod/Yup
- [ ] Error handling

### ✅ Documentation (REQUIRED)
- [ ] Documentation added/updated in `/docs/`
- [ ] README updated (if needed)
- [ ] API docs updated (if applicable)

### ✅ Code Quality
- [ ] Linting passes (`pnpm lint`)
- [ ] TypeScript compiles (if applicable)
- [ ] No console.log statements
- [ ] Following existing patterns

### ✅ Security
- [ ] No hardcoded secrets
- [ ] Environment variables in `.env.example`
- [ ] Input validation implemented

---

## 🆘 Common Git Commands

### **View Current Branch**
```bash
git branch
git status
```

### **Switch Branches**
```bash
git checkout develop
git checkout -b feature/new-feature  # Create and switch
```

### **View Remote Branches**
```bash
git branch -r
git branch -a  # All branches (local and remote)
```

### **Pull Latest Changes**
```bash
git pull origin develop
```

### **Delete Local Branch**
```bash
git branch -d feature/old-feature
git branch -D feature/old-feature  # Force delete
```

### **Delete Remote Branch**
```bash
git push origin --delete feature/old-feature
```

### **View Commit History**
```bash
git log --oneline --graph --decorate --all
```

### **Undo Last Commit (Keep Changes)**
```bash
git reset --soft HEAD~1
```

### **Discard All Local Changes**
```bash
git reset --hard HEAD
```

---

## 🎓 Useful GitHub Pages

### **Repository**
- **Main**: https://github.com/VolteRyde/volteryde-platform
- **Actions**: https://github.com/VolteRyde/volteryde-platform/actions
- **Pull Requests**: https://github.com/VolteRyde/volteryde-platform/pulls
- **Issues**: https://github.com/VolteRyde/volteryde-platform/issues
- **Settings**: https://github.com/VolteRyde/volteryde-platform/settings

### **External Services**
- **Snyk**: https://app.snyk.io/
- **SonarCloud**: https://sonarcloud.io/
- **Codecov**: https://app.codecov.io/
- **AWS Console**: https://console.aws.amazon.com/

---

## 📞 Getting Help

### **Workflow Issues**
- Check `.github/workflows/README.md`
- Review GitHub Actions logs
- Check Slack notifications

### **Git Issues**
- Check status: `git status`
- View help: `git help <command>`
- Ask team in Slack

### **CI/CD Issues**
- Review `CICD_SETUP_COMPLETE.md`
- Check workflow logs in GitHub Actions
- Verify secrets are configured

---

## ✅ Quick Setup Verification

Run these commands to verify everything is set up:

```bash
# Check remote
git remote -v
# Should show: origin git@github.com:VolteRyde/volteryde-platform.git

# Check branches
git branch -a
# Should show: main, develop, staging, remotes/origin/main, etc.

# Check you're on develop
git branch
# Should show: * develop

# Pull latest
git pull origin develop

# Run tests
./scripts/test-all.sh
```

---

## 🎉 You're All Set!

Your repository is now configured with:
- ✅ Professional branch structure
- ✅ Branch protection rules
- ✅ Automated CI/CD pipelines
- ✅ Security scanning
- ✅ Auto-deployment to dev/staging
- ✅ Manual production deployment with approvals

**Start developing with confidence!** 🚀

---

**Last Updated**: November 11, 2025  
**Version**: 1.0  
**Repository**: https://github.com/VolteRyde/volteryde-platform
