# Volteryde Platform — DNS Resolution Guide

## Domain Strategy

| Domain | Purpose |
| --- | --- |
| `volteryde.com` | **Backend API & Infrastructure** — K8s ingress, per-environment APIs |
| `volteryde.org` | **Frontend Web Apps** — all customer/internal-facing web apps (Vercel) |

---

## Complete Subdomain Map

### `volteryde.com` — Backend (AWS / EKS)

All backend subdomains resolve to the **AWS ALB** created by the EKS Ingress Controller.

| Subdomain | Target | Purpose | Environment |
| --- | --- | --- | --- |
| `api.volteryde.com` | ALB (EKS Ingress, `volteryde-prod`) | Production API Gateway | Production |
| `staging-api.volteryde.com` | ALB (EKS Ingress, `volteryde-staging`) | Staging API Gateway | Staging |
| `dev-api.volteryde.com` | ALB (EKS Ingress, `volteryde-dev`) | Dev API Gateway | Development |
| `volteryde.com` | Redirect → `volteryde.org` | Root domain redirect | — |
| `www.volteryde.com` | Redirect → `volteryde.org` | WWW redirect | — |

### `volteryde.org` — Frontend (Vercel)

All frontend subdomains are deployed on **Vercel** and point via CNAME to `cname.vercel-dns.com`.

| Subdomain | App Directory | Purpose | Local Port |
| --- | --- | --- | --- |
| `volteryde.org` | `apps/landing-page/` | Landing page / company site | 4000 |
| `auth.volteryde.org` | `apps/auth-frontend/` | Centralized login/signup | 4001 |
| `admin.volteryde.org` | `apps/admin-dashboard/` | Admin dashboard | 4002 |
| `partners.volteryde.org` | `apps/bi-partner-app/` | BI partner dashboard | 4003 |
| `support.volteryde.org` | `apps/customer-and-support-app/` | Customer support interface | 4004 |
| `dispatch.volteryde.org` | `apps/dispatcher-app/` | Fleet dispatcher interface | 4005 |
| `docs.volteryde.org` | Fumadocs (separate) | Developer documentation | 3002 |

### Mobile Apps (React Native — no DNS needed)

| App | Repository | API Endpoint Used |
| --- | --- | --- |
| Passenger App | `Client-App/` | `api.volteryde.com/api/v1` |
| Driver App | `driver-app/` | `api.volteryde.com/api/v1` |
| Fleet Management | `Fleet-Management-App/` | `api.volteryde.com/api/v1` |

---

## DNS Records to Configure

### Route 53 — `volteryde.com` Zone

After deploying the K8s Ingress, get your ALB hostname:

```bash
kubectl get ingress volteryde-ingress -n volteryde-prod -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
# Example output: k8s-volteryd-volteryd-abc123-1234567890.us-east-1.elb.amazonaws.com
```

Then create these records:

| Record | Type | Value | Notes |
| --- | --- | --- | --- |
| `api.volteryde.com` | CNAME | `<PROD-ALB-HOSTNAME>` | Production API |
| `staging-api.volteryde.com` | CNAME | `<STAGING-ALB-HOSTNAME>` | Staging API |
| `dev-api.volteryde.com` | CNAME | `<DEV-ALB-HOSTNAME>` | Dev API |
| `volteryde.com` | A | Redirect to `volteryde.org` (via S3 redirect or Alias) | Root redirect |
| `www.volteryde.com` | CNAME | Redirect to `volteryde.org` | WWW redirect |

> **Note:** If all 3 environments share a single ALB (single EKS cluster with namespace-based routing), all 3 CNAME records point to the **same ALB**. The Ingress `host:` rules differentiate traffic.

### Route 53 or Domain Registrar — `volteryde.org` Zone

| Record | Type | Value | Notes |
| --- | --- | --- | --- |
| `volteryde.org` | A | `76.76.21.21` | Vercel root domain |
| `www.volteryde.org` | CNAME | `cname.vercel-dns.com` | Vercel www |
| `auth.volteryde.org` | CNAME | `cname.vercel-dns.com` | Auth frontend |
| `admin.volteryde.org` | CNAME | `cname.vercel-dns.com` | Admin dashboard |
| `partners.volteryde.org` | CNAME | `cname.vercel-dns.com` | BI partner app |
| `support.volteryde.org` | CNAME | `cname.vercel-dns.com` | Support app |
| `dispatch.volteryde.org` | CNAME | `cname.vercel-dns.com` | Dispatcher app |
| `docs.volteryde.org` | CNAME | `cname.vercel-dns.com` | Docs platform |

### Email (Optional)

| Record | Type | Value | Notes |
| --- | --- | --- | --- |
| `volteryde.org` | MX | Your mail provider (e.g., Google Workspace) | Email routing |
| `volteryde.org` | TXT | `v=spf1 include:_spf.google.com ~all` | SPF record |

---

## SSL / TLS Certificates

### Backend (`volteryde.com`) — AWS Certificate Manager (ACM)

Request a **wildcard certificate** in ACM (us-east-1):

```
*.volteryde.com
volteryde.com
```

Then reference the ARN in the Ingress annotation:

```yaml
alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-east-1:<ACCOUNT_ID>:certificate/<CERT_ID>
```

### Frontend (`volteryde.org`) — Vercel

Vercel handles SSL automatically when you add the custom domain in each project's settings.

---

## K8s Ingress Host Configuration

The `infrastructure/kubernetes/base/ingress.yaml` currently has `CHANGE_ME_API_HOST` placeholders. Per-environment overlays should set the correct hosts.

### Production (`volteryde-prod`)

```yaml
# Host: api.volteryde.com
spec:
  rules:
  - host: api.volteryde.com
```

### Staging (`volteryde-staging`)

```yaml
# Host: staging-api.volteryde.com
spec:
  rules:
  - host: staging-api.volteryde.com
```

### Development (`volteryde-dev`)

```yaml
# Host: dev-api.volteryde.com
spec:
  rules:
  - host: dev-api.volteryde.com
```

---

## Environment Variable Reference

### `.env` (root monorepo)

```bash
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth.volteryde.org
NEXT_PUBLIC_AUTH_API_URL=https://auth.volteryde.org/api/auth
NEXT_PUBLIC_ADMIN_URL=https://admin.volteryde.org
NEXT_PUBLIC_LANDING_URL=https://volteryde.org
NEXT_PUBLIC_DOCS_URL=https://docs.volteryde.org
NEXT_PUBLIC_API_URL=https://api.volteryde.org
NEXT_PUBLIC_DISPATCH_URL=https://dispatch.volteryde.org
NEXT_PUBLIC_PARTNERS_URL=https://partners.volteryde.org
NEXT_PUBLIC_SUPPORT_URL=https://support.volteryde.org
NEXT_PUBLIC_SUPPORT_EMAIL=support@volteryde.org
```

### Mobile Apps (`Client-App/.env`)

```bash
EXPO_PUBLIC_CLIENT_AUTH_URL=https://api.volteryde.com/api/v1/client/auth
EXPO_PUBLIC_API_URL=https://api.volteryde.com/api/v1
```

### K8s ConfigMap Patches

| Environment | `API_GATEWAY_URL` | `CORS_ORIGINS` |
| --- | --- | --- |
| Dev | `https://dev-api.volteryde.com` | `http://localhost:3000,http://localhost:3001,https://dev.volteryde.com` |
| Staging | `https://staging-api.volteryde.com` | `https://staging.volteryde.com,https://staging-admin.volteryde.com` |
| Production | `https://api.volteryde.com` | `https://volteryde.com,https://www.volteryde.com,https://admin.volteryde.com` |

---

## Setup Checklist

### Step 1: AWS (Route 53 — `volteryde.com`)

- [ ] Create hosted zone for `volteryde.com` in Route 53
- [ ] Request wildcard ACM certificate: `*.volteryde.com` + `volteryde.com`
- [ ] Validate certificate via DNS (add CNAME records ACM provides)
- [ ] Deploy K8s Ingress → note ALB hostname
- [ ] Add CNAME records: `api`, `staging-api`, `dev-api` → ALB
- [ ] Update Ingress annotation with ACM certificate ARN

### Step 2: Vercel (`volteryde.org`)

- [ ] Add `volteryde.org` domain to landing-page project in Vercel
- [ ] Add `auth.volteryde.org` to auth-frontend project
- [ ] Add `admin.volteryde.org` to admin-dashboard project
- [ ] Add `partners.volteryde.org` to bi-partner-app project
- [ ] Add `support.volteryde.org` to customer-and-support-app project
- [ ] Add `dispatch.volteryde.org` to dispatcher-app project
- [ ] Add `docs.volteryde.org` to docs platform project
- [ ] Configure DNS: A record for root, CNAMEs for subdomains → Vercel

### Step 3: Verify

- [ ] `curl https://api.volteryde.com/api/v1/health` returns 200
- [ ] `curl https://staging-api.volteryde.com/api/v1/health` returns 200
- [ ] All `*.volteryde.org` subdomains load correctly with HTTPS
- [ ] CORS works: frontends can call backend API without errors
