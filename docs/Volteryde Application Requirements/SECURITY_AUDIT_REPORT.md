# Volteryde Platform — Security & Pipeline Audit Report

**Date:** 2025-01  
**Scope:** CI/CD pipelines, CORS, DNS, secrets management, infrastructure exposure

---

## Critical Issues Found & Fixed

### 1. Wrong AWS Region in All Pipelines (CRITICAL)

**Risk:** Deployments would fail or target wrong infrastructure.

| File | Before | After |
| --- | --- | --- |
| `deploy-production-enhanced.yml` | `us-east-1` | `sa-east-1` |
| `deploy-dev-enhanced.yml` | `us-east-1` | `sa-east-1` |
| `terraform-apply.yml` (3 jobs) | `us-east-1` | `sa-east-1` |
| `terraform-plan.yml` | `us-east-1` | `sa-east-1` |

### 2. Wrong EKS Cluster Name (CRITICAL)

**Risk:** Pipeline would fail to connect to EKS.

| File | Before | After |
| --- | --- | --- |
| `deploy-production-enhanced.yml` | `volteryde-cluster` | `volteryde-production` |
| `deploy-dev-enhanced.yml` | `volteryde-cluster` | `volteryde-production` |

### 3. Wrong ECR Registry Region (CRITICAL)

**Risk:** Docker images pushed/pulled from non-existent registry.

| File | Before | After |
| --- | --- | --- |
| `deploy-production-enhanced.yml` | `*.dkr.ecr.us-east-1.amazonaws.com` | `*.dkr.ecr.sa-east-1.amazonaws.com` |
| `deploy-dev-enhanced.yml` | `*.dkr.ecr.us-east-1.amazonaws.com` | `*.dkr.ecr.sa-east-1.amazonaws.com` |

### 4. Wrong SpringBoot Image Name (CRITICAL)

**Risk:** Pipeline pushes images to wrong ECR repo; K8s pulls non-existent image.

| File | Before | After |
| --- | --- | --- |
| `deploy-production-enhanced.yml` | `springboot-service` | `springboot-auth` |
| `deploy-dev-enhanced.yml` | `springboot-service` | `springboot-auth` |

### 5. Wrong Kubernetes Namespace Names (CRITICAL)

**Risk:** Deployments applied to non-existent namespaces.

| Pipeline Stage | Before | After |
| --- | --- | --- |
| DEV | `volteryde-dev` | `development` |
| Staging | `volteryde-staging` | `staging` |
| Production | `volteryde-prod` | `production` |

### 6. Incomplete CORS Configuration (HIGH)

**Risk:** Frontend apps on `.com` domains blocked by CORS when calling backend.

**Before:** Only `*.volteryde.org` patterns allowed.  
**After:** Both `*.volteryde.org` AND `*.volteryde.com` patterns allowed.

Files fixed:

- `services/volteryde-nest/volteryde-api/src/main.ts`
- `services/volteryde-nest/fleet/src/main.ts`
- `services/volteryde-nest/notifications/src/main.ts`
- `services/volteryde-nest/charging/src/main.ts`
- `services/volteryde-nest/booking/src/main.ts`
- `services/volteryde-nest/telematics/src/main.ts`
- `services/volteryde-springboot/auth-service/src/main/java/com/volteryde/auth/config/CorsConfig.java`
- `services/volteryde-springboot/auth-service/src/main/java/com/volteryde/auth/config/SecurityConfig.java`
- `infrastructure/kubernetes/overlays/production/configmap-patch.yaml`

### 7. Wrong Default AWS Region in Config Package (MEDIUM)

| File | Before | After |
| --- | --- | --- |
| `packages/config/src/env.ts` | `us-east-1` | `sa-east-1` |

---

## Security Posture Assessment

### Secrets Management — GOOD

- `.env` file is in `.gitignore` and **not tracked** by git
- AWS credentials use GitHub Actions secrets (`${{ secrets.AWS_ACCESS_KEY_ID }}`)
- AWS Account ID stored as GitHub secret (`${{ secrets.AWS_ACCOUNT_ID }}`)
- Database passwords stored in K8s Secrets (not ConfigMaps)
- GitGuardian workflow active for secret scanning (`gitguardian.yaml`)

### Infrastructure Exposure — ACCEPTABLE

| Item | Status | Notes |
| --- | --- | --- |
| AWS Account ID in K8s manifests | Acceptable | Required for IRSA ARNs and ECR URLs; overridden by CI/CD |
| RDS endpoint in ConfigMap | Acceptable | Non-sensitive; password in K8s Secret |
| ACM certificate ARNs in ingress patches | Acceptable | Required for ALB TLS termination |
| ECR registry URLs in kustomization.yaml | Acceptable | Overridden by pipeline `kustomize edit set image` |

### Recommendations for Further Hardening

1. **Rotate secrets** — Change `JWT_SECRET`, database passwords, and Temporal API key in production
2. **Enable AWS SSO/OIDC** — Replace static `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` with OIDC federation for GitHub Actions
3. **Pod Security Standards** — Add `PodSecurityPolicy` or `PodSecurity` admission controller
4. **Network Policies** — Restrict pod-to-pod traffic to only necessary paths
5. **RBAC audit** — Review K8s RBAC roles for least-privilege principle
6. **Image scanning** — Add ECR image scanning or Trivy/Snyk to CI pipeline
7. **WAF** — Enable AWS WAF on the ALB for DDoS and bot protection

---

## docs.volteryde.org Setup

**Status:** No Vercel project exists yet.

### Steps to Create

1. Go to [Vercel Dashboard](https://vercel.com/platforms-projects-405fbc6f)
2. Click **Add New → Project**
3. Import the `volteryde-platform` git repository
4. Set **Root Directory** to `docs/Volteryde Application Requirements`
5. Framework: **Vite** (auto-detected)
6. Build command: `pnpm run build`
7. Output directory: `dist`
8. Deploy
9. Go to **Project Settings → Domains**
10. Add `docs.volteryde.org`
11. In your DNS provider, add CNAME: `docs.volteryde.org` → `cname.vercel-dns.com`
12. Wait for DNS propagation and SSL provisioning

---

## Files Modified in This Audit

### Pipelines (4 files)

- `.github/workflows/deploy-production-enhanced.yml`
- `.github/workflows/deploy-dev-enhanced.yml`
- `.github/workflows/terraform-apply.yml`
- `.github/workflows/terraform-plan.yml`

### CORS (9 files)

- `services/volteryde-nest/volteryde-api/src/main.ts`
- `services/volteryde-nest/fleet/src/main.ts`
- `services/volteryde-nest/notifications/src/main.ts`
- `services/volteryde-nest/charging/src/main.ts`
- `services/volteryde-nest/booking/src/main.ts`
- `services/volteryde-nest/telematics/src/main.ts`
- `services/volteryde-springboot/auth-service/.../CorsConfig.java`
- `services/volteryde-springboot/auth-service/.../SecurityConfig.java`
- `infrastructure/kubernetes/overlays/production/configmap-patch.yaml`

### Configuration (1 file)

- `packages/config/src/env.ts`

### Documentation (2 files)

- `docs/Volteryde Application Requirements/DNS_RESOLUTION_GUIDE.md`
- `docs/Volteryde Application Requirements/SECURITY_AUDIT_REPORT.md` (this file)
