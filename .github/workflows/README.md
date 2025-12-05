# Volteryde Platform - CI/CD Workflows

This directory contains all GitHub Actions workflows for the Volteryde Platform's CI/CD pipeline.

## 🔄 Workflow Overview

### Continuous Integration (CI)

#### **ci-backend-nestjs.yml**
- **Triggers**: Push/PR to `main` or `develop` branches with changes in `services/volteryde-nest/**`
- **What it does**:
  - Runs ESLint and Prettier checks
  - Executes unit tests with coverage
  - Runs integration tests
  - Performs security scans with GitGuardian
  - Uploads coverage to Codecov

#### **ci-backend-java.yml**
- **Triggers**: Push/PR to `main` or `develop` branches with changes in `services/volteryde-springboot/**`
- **What it does**:
  - Compiles Java code with Maven
  - Runs JUnit tests
  - Generates JaCoCo coverage reports
  - Performs SonarQube code quality analysis
  - Runs OWASP dependency checks

#### **ci-frontend.yml**
- **Triggers**: Push/PR to `main` or `develop` branches with changes in `apps/**`
- **What it does**:
  - Runs ESLint for code quality
  - Performs type checking
  - Executes tests for each frontend app
  - Builds production bundles
  - Runs security scans

### Container Management

#### **docker-build-push.yml**
- **Triggers**: Push to `develop` or `main` branches, manual dispatch
- **What it does**:
  - Builds Docker images for all services
  - Pushes images to Amazon ECR
  - Tags images with branch name and commit SHA
  - Scans images with Trivy for vulnerabilities
  - Uploads security findings to GitHub Security

### Infrastructure as Code

#### **terraform-plan.yml**
- **Triggers**: Pull requests with changes in `infrastructure/terraform/**`
- **What it does**:
  - Runs Terraform format checks
  - Validates Terraform configurations
  - Generates Terraform plan for dev, staging, and production
  - Posts plan summary as PR comment

#### **terraform-apply.yml**
- **Triggers**: Push to `main` branch, manual dispatch
- **What it does**:
  - Applies Terraform changes to infrastructure
  - Requires manual approval for production
  - Sends Slack notifications on success/failure

### Deployment Workflows

#### **deploy-dev.yml**
- **Triggers**: Push to `develop` branch, manual dispatch
- **Environment**: Development
- **What it does**:
  - Updates Kubernetes deployments with new images
  - Waits for rollout completion
  - Runs smoke tests
  - Automatic rollback on failure
  - Sends Slack notifications

#### **deploy-staging.yml**
- **Triggers**: Push to `staging` branch, manual dispatch
- **Environment**: Staging
- **What it does**:
  - Creates deployment backup
  - Updates Kubernetes deployments
  - Runs integration and smoke tests
  - Automatic rollback on failure
  - Sends Slack notifications

#### **deploy-production.yml**
- **Triggers**: Manual dispatch only
- **Environment**: Production
- **What it does**:
  - Requires manual approval
  - Validates deployment confirmation
  - Creates deployment backup (90-day retention)
  - Performs blue-green deployment
  - Runs health checks and smoke tests
  - Monitors metrics for 5 minutes
  - Automatic rollback on failure
  - Sends critical Slack notifications

### Security & Compliance

#### **security-scan.yml**
- **Triggers**: Daily at 6 AM UTC, push to `main`/`develop`, PR to `main`, manual dispatch
- **What it does**:
  - Secret and dependency scanning with GitGuardian
  - Container vulnerability scanning with Trivy
  - Secret detection with Gitleaks
  - CodeQL security analysis
  - Notifies team of security issues

### Automation

#### **pr-labeler.yml**
- **Triggers**: PR opened, synchronized, reopened
- **What it does**:
  - Auto-labels PRs based on changed files
  - Adds size labels (xs, s, m, l, xl)
  - Detects breaking changes
  - Improves PR organization

## 🚀 Usage Guide

### Running Workflows Manually

**Deploy to Production:**
```bash
# Via GitHub UI
1. Go to Actions tab
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Enter version/SHA
5. Type "DEPLOY TO PRODUCTION" to confirm
6. Wait for manual approval
```

**Build Specific Service:**
```bash
# Trigger via Git commit message
git commit -m "feat: add new feature [build:nestjs]"
```

### Local Development Scripts

```bash
# Setup local environment
./scripts/setup-local.sh

# Build all services
./scripts/build-all.sh

# Run all tests
./scripts/test-all.sh

# Run smoke tests
./scripts/smoke-tests.sh dev
```

## 📋 Required Secrets

Configure these secrets in GitHub repository settings:

### AWS Credentials
- `AWS_ACCESS_KEY_ID` - AWS access key for dev/staging
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for dev/staging
- `AWS_ACCESS_KEY_ID_PROD` - AWS access key for production
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS secret key for production
- `AWS_ACCOUNT_ID` - AWS account ID

### Security & Code Quality
- `GITGUARDIAN_API_KEY` - GitGuardian secret and security scanning
- `SONAR_TOKEN` - SonarQube code quality
- `CODECOV_TOKEN` - Codecov coverage reporting
- `GITLEAKS_LICENSE` - Gitleaks secret detection (if using paid version)

### Notifications
- `SLACK_WEBHOOK_URL` - Slack notifications

## 🏷️ Branch Strategy

- **`main`**: Production releases
- **`develop`**: Development integration
- **`staging`**: Staging releases
- **`feature/*`**: Feature branches
- **`hotfix/*`**: Hotfix branches

## 🔒 Environment Protection Rules

### Development
- Auto-deploy on push to `develop`
- No approval required

### Staging
- Auto-deploy on push to `staging`
- No approval required

### Production
- Manual deployment only
- Requires approval from platform leads
- Must type confirmation message

## 📊 Monitoring & Notifications

All workflows send notifications to Slack:
- ✅ Success: Green notification
- ❌ Failure: Red notification with rollback info
- ⚠️ Warning: Yellow notification for security issues

## 🛠️ Troubleshooting

### Workflow Failed?

1. **Check the logs** in GitHub Actions tab
2. **Review the error message** in the failed step
3. **Check Slack notifications** for details
4. **Look for rollback confirmation** (deployments only)

### Rollback Needed?

**Development/Staging:**
```bash
kubectl rollout undo deployment/<service-name> -n volteryde-<env>
```

**Production:**
```bash
# Automatically handled by workflow
# Or run manually:
kubectl rollout undo deployment/<service-name> -n volteryde-prod
```

### Docker Image Not Found?

```bash
# Check if image exists in ECR
aws ecr describe-images \
  --repository-name volteryde/<service> \
  --image-ids imageTag=<tag>
```

## 📚 Additional Resources

- [CICD_PIPELINE_GUIDE.md](../../docs/Volteryde%20Application%20Requirements/CICD_PIPELINE_GUIDE.md) - Detailed CI/CD documentation
- [REPOSITORY_STRUCTURE.md](../../docs/Volteryde%20Application%20Requirements/REPOSITORY_STRUCTURE.md) - Repository organization
- [INFRASTRUCTURE_GUIDE.md](../../docs/Volteryde%20Application%20Requirements/INFRASTRUCTURE_GUIDE.md) - AWS infrastructure setup
- [KUBERNETES_DEPLOYMENT_GUIDE.md](../../docs/Volteryde%20Application%20Requirements/KUBERNETES_DEPLOYMENT_GUIDE.md) - Kubernetes deployment patterns

## 🤝 Contributing

When modifying workflows:
1. Test locally when possible
2. Create a PR with description of changes
3. Get approval from DevOps team
4. Monitor first run after merge

## 📞 Support

- **DevOps Team**: For infrastructure and deployment issues
- **Platform Leads**: For workflow design questions
- **Security Team**: For security scan failures
