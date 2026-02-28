# Volteryde Platform — CI/CD Workflows

## Workflows

| File | Trigger | Purpose |
|---|---|---|
| `deploy-production-enhanced.yml` | Push to `main`, manual | **Full Pipeline** — Build → Dev → Staging → Production |
| `deploy-dev-enhanced.yml` | Push to `develop`, manual | Build images & deploy to Dev sandbox |
| `ci-comprehensive.yml` | Push/PR to `develop`, `staging`, `main` | Quality gates for all services (NestJS, Spring Boot, Temporal, Frontend) |
| `terraform-plan.yml` | PR to `main`/`develop` | Terraform plan & PR comment |
| `terraform-apply.yml` | Push to `main`/`develop`, manual | Terraform apply to infrastructure |
| `gitguardian.yaml` | Push, PR | Secret & security scanning |
| `pr-labeler.yml` | PR events | Auto-label PRs by file changes |

## Deployment Flow

```
Push to main
  └─ Full Pipeline (deploy-production-enhanced.yml)
       ├─ Stage 1: Build & push Docker images to ECR
       ├─ Stage 2: Deploy to Dev (volteryde-dev)
       ├─ Stage 3: Deploy to Staging (volteryde-staging)
       └─ Stage 4: Blue-green deploy to Production (volteryde-prod)

Push to develop
  └─ Dev Deploy (deploy-dev-enhanced.yml)
       ├─ Build & push Docker images
       └─ Deploy to Dev sandbox
```

Each stage sends Slack notifications and rolls back on failure. If any stage fails, subsequent stages are skipped.

## Required Secrets

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — AWS credentials
- `AWS_ACCOUNT_ID` — For ECR registry URL
- `SLACK_WEBHOOK_URL` — Slack notifications
- `GITGUARDIAN_API_KEY` — Security scanning

## Rollback

```bash
# Automatic: handled by workflows on failure
# Manual:
kubectl rollout undo deployment/<service> -n volteryde-<env>
```
