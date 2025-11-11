# CI/CD Pipeline Guide
## Automated Build, Test, and Deployment with GitHub Actions

---

## Overview

This guide describes the complete CI/CD pipeline for Volteryde using **GitHub Actions**. The pipeline handles:

- ✅ **Continuous Integration** - Build, lint, test, security scan
- ✅ **Infrastructure Deployment** - Terraform apply via GitOps
- ✅ **Application Deployment** - Docker build and Kubernetes deploy
- ✅ **Environment Promotion** - Dev → Staging → Production
- ✅ **Automated Rollbacks** - Revert on deployment failure

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│  GitHub Repository (Main Branch)                        │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow Triggers                       │
│  • Push to main/develop                                 │
│  • Pull Request                                         │
│  • Manual trigger (workflow_dispatch)                   │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  Parallel CI Jobs                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Lint &   │  │ Security │  │ Terraform│             │
│  │ Test     │  │ Scan     │  │ Validate │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  Build & Push Docker Images                             │
│  → Amazon ECR                                           │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│  Deploy to Kubernetes (EKS)                             │
│  • Dev (auto)                                           │
│  • Staging (auto on develop)                            │
│  • Production (manual approval required)                │
└─────────────────────────────────────────────────────────┘
```

---

## GitHub Actions Workflow Structure

### Workflow Files

```
.github/workflows/
├── ci-backend-java.yml          # Java services CI
├── ci-backend-nestjs.yml        # NestJS services CI
├── ci-frontend.yml              # Frontend apps CI
├── terraform-plan.yml           # Infrastructure plan on PR
├── terraform-apply.yml          # Infrastructure apply on merge
├── deploy-dev.yml               # Auto-deploy to dev
├── deploy-staging.yml           # Auto-deploy to staging
├── deploy-production.yml        # Manual deploy to prod
└── security-scan.yml            # Daily security scans
```

---

## CI Workflow - NestJS Services

**`.github/workflows/ci-backend-nestjs.yml`**:
```yaml
name: CI - NestJS Services

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/**/*.ts'
      - 'services/**/package.json'
  pull_request:
    branches: [main, develop]
    paths:
      - 'services/**/*.ts'

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      telematics: ${{ steps.filter.outputs.telematics }}
      booking: ${{ steps.filter.outputs.booking }}
      fleet: ${{ steps.filter.outputs.fleet }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            telematics:
              - 'services/telematics-domain/**'
            booking:
              - 'services/booking-domain/**'
            fleet:
              - 'services/fleet-operations-domain/**'

  lint-and-test-telematics:
    needs: detect-changes
    if: needs.detect-changes.outputs.telematics == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        working-directory: services/telematics-domain
      
      - name: Run ESLint
        run: pnpm lint
        working-directory: services/telematics-domain
      
      - name: Run Prettier check
        run: pnpm format:check
        working-directory: services/telematics-domain
      
      - name: Type check
        run: pnpm type-check
        working-directory: services/telematics-domain
      
      - name: Run unit tests
        run: pnpm test:cov
        working-directory: services/telematics-domain
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: services/telematics-domain/coverage/lcov.info
          flags: telematics
          fail_ci_if_error: true
      
      - name: Run integration tests
        run: pnpm test:e2e
        working-directory: services/telematics-domain
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/telematics_test
          REDIS_URL: redis://localhost:6379
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: telematics_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

  security-scan-nestjs:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --all-projects --severity-threshold=high
      
      - name: Run npm audit
        run: |
          cd services/telematics-domain
          pnpm audit --audit-level=moderate
```

---

## CI Workflow - Java Services

**`.github/workflows/ci-backend-java.yml`**:
```yaml
name: CI - Java Services

on:
  push:
    branches: [main, develop]
    paths:
      - 'services/authentication-domain/**'
      - 'services/payment-domain/**'
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test-authentication:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven
      
      - name: Build with Maven
        run: mvn clean compile
        working-directory: services/authentication-domain
      
      - name: Run tests
        run: mvn test
        working-directory: services/authentication-domain
      
      - name: Generate coverage report
        run: mvn jacoco:report
        working-directory: services/authentication-domain
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: services/authentication-domain/target/site/jacoco/jacoco.xml
          flags: authentication
      
      - name: Run integration tests
        run: mvn verify -P integration-test
        working-directory: services/authentication-domain
      
      - name: SonarQube Scan
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        run: |
          mvn sonar:sonar \
            -Dsonar.host.url=https://sonarcloud.io \
            -Dsonar.organization=volteryde \
            -Dsonar.projectKey=volteryde_authentication-domain
        working-directory: services/authentication-domain
      
      - name: Build JAR
        run: mvn package -DskipTests
        working-directory: services/authentication-domain
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: authentication-service-jar
          path: services/authentication-domain/target/*.jar
```

---

## Terraform Plan Workflow (PR)

**`.github/workflows/terraform-plan.yml`**:
```yaml
name: Terraform Plan

on:
  pull_request:
    branches: [main]
    paths:
      - 'infrastructure/terraform/**'

jobs:
  terraform-plan:
    runs-on: ubuntu-latest
    
    permissions:
      contents: read
      pull-requests: write
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.5.0
      
      - name: Terraform Format Check
        run: terraform fmt -check -recursive
        working-directory: infrastructure/terraform
      
      - name: Terraform Init
        run: terraform init
        working-directory: infrastructure/terraform/environments/dev
      
      - name: Terraform Validate
        run: terraform validate
        working-directory: infrastructure/terraform/environments/dev
      
      - name: Terraform Plan
        id: plan
        run: terraform plan -out=tfplan
        working-directory: infrastructure/terraform/environments/dev
      
      - name: Comment PR with plan
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan 📝
            
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`
            
            *Pushed by: @${{ github.actor }}*`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });
```

---

## Build and Push Docker Images

**`.github/workflows/build-and-push.yml`**:
```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [develop, main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: ${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com

jobs:
  build-telematics:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.ECR_REGISTRY }}/volteryde/telematics-domain
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: services/telematics-domain
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Scan image with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.ECR_REGISTRY }}/volteryde/telematics-domain:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## Deploy to Kubernetes

**`.github/workflows/deploy-dev.yml`**:
```yaml
name: Deploy to Dev

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  EKS_CLUSTER: volteryde-dev

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \
            --region ${{ env.AWS_REGION }} \
            --name ${{ env.EKS_CLUSTER }}
      
      - name: Deploy with Kustomize
        run: |
          kubectl apply -k infrastructure/kubernetes/overlays/dev
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/telematics-domain -n volteryde-dev --timeout=5m
          kubectl rollout status deployment/booking-domain -n volteryde-dev --timeout=5m
          kubectl rollout status deployment/fleet-operations-domain -n volteryde-dev --timeout=5m
      
      - name: Run smoke tests
        run: |
          ./scripts/smoke-tests.sh dev
      
      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "✅ Deployment to DEV succeeded",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment to DEV environment successful*\n\n*Commit:* ${{ github.sha }}\n*Author:* ${{ github.actor }}"
                  }
                }
              ]
            }
      
      - name: Rollback on failure
        if: failure()
        run: |
          kubectl rollout undo deployment/telematics-domain -n volteryde-dev
          kubectl rollout undo deployment/booking-domain -n volteryde-dev
      
      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "❌ Deployment to DEV failed and was rolled back",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment to DEV environment failed*\n\n*Commit:* ${{ github.sha }}\n*Author:* ${{ github.actor }}\n\n⚠️ Automatic rollback executed"
                  }
                }
              ]
            }
```

---

## Production Deployment (Manual Approval)

**`.github/workflows/deploy-production.yml`**:
```yaml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Docker image tag to deploy'
        required: true
        type: string

env:
  AWS_REGION: us-east-1
  EKS_CLUSTER: volteryde-production

jobs:
  approval:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.volteryde.com
    
    steps:
      - name: Manual approval required
        run: echo "Deployment to production requires manual approval"
  
  deploy:
    needs: approval
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \
            --region ${{ env.AWS_REGION }} \
            --name ${{ env.EKS_CLUSTER }}
      
      - name: Create deployment backup
        run: |
          kubectl get deployment -n volteryde-prod -o yaml > deployment-backup.yaml
      
      - name: Upload backup artifact
        uses: actions/upload-artifact@v3
        with:
          name: deployment-backup
          path: deployment-backup.yaml
      
      - name: Blue-Green Deployment - Deploy Green
        run: |
          # Update image tags in Kustomize
          cd infrastructure/kubernetes/overlays/production
          kustomize edit set image \
            telematics-domain=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.us-east-1.amazonaws.com/volteryde/telematics-domain:${{ inputs.version }}
          
          kubectl apply -k .
      
      - name: Wait for green deployment
        run: |
          kubectl rollout status deployment/telematics-domain -n volteryde-prod --timeout=10m
      
      - name: Run production smoke tests
        run: |
          ./scripts/smoke-tests.sh production
      
      - name: Switch traffic to green (if smoke tests pass)
        run: |
          kubectl patch service telematics-service -n volteryde-prod \
            -p '{"spec":{"selector":{"version":"green"}}}'
      
      - name: Monitor metrics for 5 minutes
        run: |
          sleep 300
          # Check error rate, latency from Prometheus
          ./scripts/check-metrics.sh
      
      - name: Rollback if metrics degraded
        if: failure()
        run: |
          kubectl rollout undo deployment/telematics-domain -n volteryde-prod
          kubectl patch service telematics-service -n volteryde-prod \
            -p '{"spec":{"selector":{"version":"blue"}}}'
      
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
          payload: |
            {
              "text": "${{ job.status == 'success' && '✅' || '❌' }} Production deployment ${{ job.status }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment*\n\n*Version:* ${{ inputs.version }}\n*Status:* ${{ job.status }}\n*Deployed by:* ${{ github.actor }}"
                  }
                }
              ]
            }
```

---

## Secrets Management

### GitHub Secrets Required

```
AWS_ACCESS_KEY_ID              # Dev/Staging AWS credentials
AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID_PROD         # Production AWS credentials (separate)
AWS_SECRET_ACCESS_KEY_PROD
AWS_ACCOUNT_ID                 # AWS account ID for ECR
SLACK_WEBHOOK_URL              # Slack notifications
SNYK_TOKEN                     # Snyk security scanning
SONAR_TOKEN                    # SonarQube code quality
CODECOV_TOKEN                  # Code coverage reporting
```

---

## Deployment Strategy Comparison

| Strategy | Use Case | Rollback Time | Risk |
|----------|----------|---------------|------|
| **Rolling Update** | Dev/Staging | 30 seconds | Low |
| **Blue-Green** | Production | Instant | Very Low |
| **Canary** | High-traffic production | 5-10 minutes | Very Low |

---

## Summary

✅ Automated CI for NestJS and Java services  
✅ Security scanning with Snyk and Trivy  
✅ Terraform plan on PRs  
✅ Docker build and push to ECR  
✅ Automated deployment to dev/staging  
✅ Manual approval for production  
✅ Blue-green deployment strategy  
✅ Automatic rollback on failure  
✅ Slack notifications  

**Next**: See `OBSERVABILITY_GUIDE.md` for monitoring setup
