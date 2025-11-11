# ✅ Web Applications Setup Complete!

## 🎉 Web Apps Created with Fumadocs

All web applications have been created using Fumadocs for a consistent, professional documentation and UI framework.

## 📱 Applications Created

### 1. Admin Dashboard (React + Fumadocs)

**Location**: `apps/admin-dashboard/`  
**Package**: `@volteryde/admin-dashboard`  
**Port**: `3010`

**Features**: Platform administration, user management, analytics, fleet oversight, financial operations, system configuration

**Tech Stack**: React, React Router, Fumadocs MDX, Tailwind CSS

### 2. Driver App (React + Fumadocs)

**Location**: `apps/driver-app/`  
**Package**: `@volteryde/driver-app`  
**Port**: `3011`

**Features**: Ride management, earnings dashboard, vehicle diagnostics, navigation, document management, performance metrics

**Tech Stack**: React, React Router, Fumadocs MDX, Tailwind CSS

### 3. Support App (React + Fumadocs)

**Location**: `apps/support-app/`  
**Package**: `@volteryde/support-app`  
**Port**: `3012`

**Features**: Ticket management, user lookup, live chat, issue resolution, knowledge base, support analytics

**Tech Stack**: React, React Router, Fumadocs MDX, Tailwind CSS

### 4. BI & Partner App (Next.js + Fumadocs)

**Location**: `apps/bi-partner-app/`  
**Package**: `@volteryde/bi-partner-app`  
**Port**: `3013`

**Features**: Business intelligence, partner management, advanced reporting, data visualization, API monitoring, revenue analytics

**Tech Stack**: Next.js 16, React 19, Fumadocs, Tailwind CSS, TypeScript

## 📁 Directory Structure

```
volteryde-platform/apps/
├── mobile-passenger-app/      # React Native
├── mobile-driver-app/         # React Native
├── admin-dashboard/           # React + Fumadocs (port 3010)
├── driver-app/                # React + Fumadocs (port 3011)
├── support-app/               # React + Fumadocs (port 3012)
├── bi-partner-app/            # Next.js + Fumadocs (port 3013)
└── docs-platform/             # Platform docs (port 3002)
```

## 🚀 Running Applications

```bash
# Admin Dashboard
cd apps/admin-dashboard && pnpm install && pnpm dev
# → http://localhost:3010

# Driver App
cd apps/driver-app && pnpm install && pnpm dev
# → http://localhost:3011

# Support App
cd apps/support-app && pnpm install && pnpm dev
# → http://localhost:3012

# BI & Partner App
cd apps/bi-partner-app && pnpm install && pnpm dev
# → http://localhost:3013

# Documentation Platform
cd apps/docs-platform && pnpm install && pnpm dev
# → http://localhost:3002
```

## 📊 Port Assignments

| Application | Port | Framework |
|-------------|------|-----------|
| NestJS Backend | 3000 | NestJS |
| Spring Boot Backend | 8080 | Java |
| Documentation Platform | 3002 | React Router |
| Admin Dashboard | 3010 | React Router |
| Driver App | 3011 | React Router |
| Support App | 3012 | React Router |
| BI & Partner App | 3013 | Next.js |

## 🎯 Complete Platform

**Total Applications**: 10

- ✅ 2 Mobile apps (React Native)
- ✅ 4 Web apps (React + Next.js with Fumadocs)
- ✅ 1 Documentation platform (Fumadocs)
- ✅ 2 Backend services (Spring Boot + NestJS)
- ✅ 1 Worker service (Temporal)
- ✅ Centralized configuration (@volteryde/config)

## 🔗 Integration

All apps use centralized configuration:

```typescript
import { env } from '@volteryde/config';

const apiUrl = `http://localhost:${env.PORT}`;
```

## 📚 Documentation

Each app has its own documentation in `content/docs/index.mdx`. Add more MDX files to expand documentation.

---

**Built with ❤️ using Fumadocs**
