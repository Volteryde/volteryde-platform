# Deployment Architecture - Volteryde Platform

## 🏗️ Overview

The Volteryde Platform uses a **hybrid deployment strategy** with backend services on AWS and frontend applications on Vercel.

---

## 📊 Deployment Strategy

### **Backend Services → AWS EKS**

The following services are containerized and deployed to AWS EKS:

1. **NestJS Services** (Port 3000)
   - Booking Service
   - Charging Service
   - Fleet Service
   - Telematics Service
   - Notifications Service

2. **Spring Boot Services** (Port 8080)
   - Auth Service
   - Payment Service
   - User Management Service

3. **Temporal Workers**
   - Booking workflows
   - Charging workflows
   - Payment workflows

**Deployment Method**: Docker containers via GitHub Actions → ECR → EKS

---

### **Frontend Applications → Vercel**

The following Next.js/React applications are deployed to Vercel:

1. **Admin Dashboard** (`apps/admin-dashboard`)
   - Port: 4002 (local)
   - Vercel URL: `admin.volteryde.com`

2. **Auth Frontend** (`apps/auth-frontend`)
   - Port: 4001 (local)
   - Vercel URL: `auth.volteryde.com`

3. **BI Partner App** (`apps/bi-partner-app`)
   - Port: 4003 (local)
   - Vercel URL: `bi.volteryde.com`

4. **Customer & Support App** (`apps/customer-and-support-app`)
   - Port: 4004 (local)
   - Vercel URL: `app.volteryde.com`

5. **Dispatcher App** (`apps/dispatcher-app`)
   - Port: 4005 (local)
   - Vercel URL: `dispatch.volteryde.com`

6. **Landing Page** (`apps/landing-page`)
   - Port: 4000 (local)
   - Vercel URL: `volteryde.com`

**Deployment Method**: 
- Automatic deployment via Vercel GitHub integration
- Manual deployment via Vercel CLI
- **NOT** deployed to AWS EKS

---

## 🔄 Deployment Flow by Environment

### **Development Environment**

```
┌─────────────────────────────────────────────────────────────┐
│                    Push to develop                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CI Pipeline (Quality Gates)                     │
│  • Security Scan                                             │
│  • Backend Tests (NestJS + Spring Boot)                      │
│  • Frontend Tests (All 6 apps)                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│   Backend → AWS EKS      │  │   Frontend → Vercel      │
│                          │  │                          │
│  • Build Docker images   │  │  • Vercel auto-deploy    │
│  • Push to ECR           │  │  • Preview URLs          │
│  • Deploy to EKS Dev     │  │  • Environment: Preview  │
│  • Health checks         │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

---

### **Staging Environment**

```
┌─────────────────────────────────────────────────────────────┐
│                   Merge to staging                           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CI Pipeline (Quality Gates)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│   Backend → AWS EKS      │  │   Frontend → Vercel      │
│                          │  │                          │
│  • Build Docker images   │  │  • Vercel auto-deploy    │
│  • Push to ECR           │  │  • staging.*.com URLs    │
│  • Deploy to EKS Staging │  │  • Environment: Staging  │
│  • Integration tests     │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

---

### **Production Environment**

```
┌─────────────────────────────────────────────────────────────┐
│                    Merge to main                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              CI Pipeline (Quality Gates)                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Manual Approval Gate                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│   Backend → AWS EKS      │  │   Frontend → Vercel      │
│                          │  │                          │
│  • Blue-Green Deploy     │  │  • Vercel auto-deploy    │
│  • Health checks         │  │  • Production URLs       │
│  • Smoke tests           │  │  • Environment: Prod     │
│  • 5-min monitoring      │  │  • Instant rollback      │
└──────────────────────────┘  └──────────────────────────┘
```

---

## 🔧 Configuration

### **Backend Services (AWS EKS)**

**Environment Variables** (stored in Kubernetes ConfigMaps/Secrets):
```bash
# Database
DATABASE_HOST=<RDS_ENDPOINT>
DATABASE_PASSWORD=<SECRET>

# Redis
REDIS_HOST=<ELASTICACHE_ENDPOINT>

# Temporal
TEMPORAL_ADDRESS=<TEMPORAL_CLOUD>
TEMPORAL_NAMESPACE=volteryde

# API Keys
JWT_SECRET=<SECRET>
```

**Deployment Files**:
- `.github/workflows/deploy-dev-enhanced.yml`
- `.github/workflows/deploy-staging-enhanced.yml`
- `.github/workflows/deploy-production-enhanced.yml`

---

### **Frontend Applications (Vercel)**

**Environment Variables** (stored in Vercel):
```bash
# API Endpoints
NEXT_PUBLIC_API_URL=https://api.volteryde.com
NEXT_PUBLIC_AUTH_URL=https://auth-api.volteryde.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Third-party Services
NEXT_PUBLIC_GOOGLE_MAPS_KEY=<KEY>
```

**Deployment Configuration**:
- `apps/admin-dashboard/vercel.json`
- `apps/auth-frontend/vercel.json`
- `apps/bi-partner-app/vercel.json`
- `apps/customer-and-support-app/vercel.json`
- `apps/dispatcher-app/vercel.json`
- `apps/landing-page/vercel.json`

**Vercel Settings**:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Root Directory**: `apps/<app-name>`

---

## 🌐 Domain Configuration

### **Backend APIs (AWS)**

| Service | Development | Staging | Production |
|---------|------------|---------|------------|
| **Main API** | `dev-api.volteryde.com` | `staging-api.volteryde.com` | `api.volteryde.com` |
| **Auth API** | `dev-auth-api.volteryde.com` | `staging-auth-api.volteryde.com` | `auth-api.volteryde.com` |

**DNS**: Route53  
**SSL**: AWS Certificate Manager  
**Load Balancer**: Application Load Balancer (ALB)

---

### **Frontend Apps (Vercel)**

| Application | Development | Staging | Production |
|-------------|------------|---------|------------|
| **Landing Page** | `dev.volteryde.com` | `staging.volteryde.com` | `volteryde.com` |
| **Admin Dashboard** | `dev-admin.volteryde.com` | `staging-admin.volteryde.com` | `admin.volteryde.com` |
| **Auth Frontend** | `dev-auth.volteryde.com` | `staging-auth.volteryde.com` | `auth.volteryde.com` |
| **Customer App** | `dev-app.volteryde.com` | `staging-app.volteryde.com` | `app.volteryde.com` |
| **Dispatcher App** | `dev-dispatch.volteryde.com` | `staging-dispatch.volteryde.com` | `dispatch.volteryde.com` |
| **BI Partner App** | `dev-bi.volteryde.com` | `staging-bi.volteryde.com` | `bi.volteryde.com` |

**DNS**: Vercel DNS or Route53  
**SSL**: Vercel SSL (automatic)  
**CDN**: Vercel Edge Network

---

## 📦 What Gets Deployed Where

### **AWS EKS Deployments**

✅ **Included**:
- NestJS microservices (Booking, Charging, Fleet, Telematics, Notifications)
- Spring Boot services (Auth, Payment, User Management)
- Temporal Workers
- Background jobs
- API gateways

❌ **NOT Included**:
- Frontend applications (these go to Vercel)
- Static assets (served by Vercel CDN)

---

### **Vercel Deployments**

✅ **Included**:
- All 6 Next.js/React applications
- Static assets and images
- API routes (Next.js API routes)
- Edge functions (if any)

❌ **NOT Included**:
- Backend microservices (these go to AWS EKS)
- Databases
- Message queues

---

## 🚀 Deployment Commands

### **Backend Services (AWS)**

```bash
# Deploy to Development
git checkout develop
git push origin develop
# → Triggers deploy-dev-enhanced.yml

# Deploy to Staging
git checkout staging
git merge develop
git push origin staging
# → Triggers deploy-staging-enhanced.yml

# Deploy to Production
git checkout main
git merge staging
git push origin main
# → Triggers deploy-production-enhanced.yml (requires approval)
```

---

### **Frontend Applications (Vercel)**

**Automatic Deployment** (Recommended):
```bash
# Vercel automatically deploys on push to:
# - develop → Preview deployment
# - staging → Staging deployment
# - main → Production deployment
```

**Manual Deployment** (If needed):
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy specific app
cd apps/admin-dashboard
vercel --prod  # Production
vercel         # Preview
```

---

## 🔄 Rollback Procedures

### **Backend Services (AWS)**

```bash
# Automatic rollback on failure (built into workflows)

# Manual rollback
kubectl rollout undo deployment/nestjs-service -n volteryde-prod
kubectl rollout undo deployment/springboot-service -n volteryde-prod
```

---

### **Frontend Applications (Vercel)**

```bash
# Via Vercel Dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "Promote to Production"

# Via Vercel CLI
vercel rollback
```

---

## 📊 Monitoring

### **Backend (AWS CloudWatch)**

- EKS cluster metrics
- RDS database metrics
- Application logs
- Custom metrics

**Access**: AWS Console → CloudWatch

---

### **Frontend (Vercel Analytics)**

- Page views
- Core Web Vitals
- Error tracking
- Performance metrics

**Access**: Vercel Dashboard → Analytics

---

## 🔐 Security

### **Backend (AWS)**

- Private VPC
- Security groups
- IAM roles
- KMS encryption
- Secrets Manager

---

### **Frontend (Vercel)**

- Automatic HTTPS
- DDoS protection
- Edge network security
- Environment variables encryption
- Preview deployment protection

---

## 💡 Best Practices

### **Backend Deployments**

1. Always run CI pipeline before deploying
2. Use blue-green deployment for production
3. Monitor CloudWatch alarms during deployment
4. Keep deployment backups for 90 days
5. Test rollback procedures regularly

---

### **Frontend Deployments**

1. Use Vercel preview deployments for testing
2. Enable Vercel protection for preview deployments
3. Configure environment variables per environment
4. Use Vercel Analytics to monitor performance
5. Test on multiple devices before promoting to production

---

## 📞 Support

### **Backend Issues**
- Check AWS CloudWatch logs
- Review EKS pod status
- Contact DevOps team

### **Frontend Issues**
- Check Vercel deployment logs
- Review Vercel Analytics
- Check browser console
- Contact Frontend team

---

**Last Updated**: 2026-02-27  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
