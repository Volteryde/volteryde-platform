# Volteryde NestJS Backend

**Status**: Foundation Complete ✅ | Implementation In Progress 🚧

NestJS backend service handling Telematics, Booking, Fleet Operations, and Charging Infrastructure.

## 🏗️ Centralized Architecture

This service follows a centralized architecture pattern to ensure consistency and maintainability.

### 1. Global Response Interceptor
All successful responses are automatically wrapped in a standard format:
```json
{
  "data": { ... },
  "timestamp": "ISO_DATE_STRING",
  "status": 200
}
```
**Usage:** Simply return the data from your controller. The interceptor handles the rest.

### 2. Global Exception Filter
All exceptions are caught and formatted into a clean JSON error response.
**Usage:** Throw standard NestJS exceptions (e.g., `BadRequestException`).

### 3. Centralized Database
Database connections are managed by `DatabaseModule`.
**Usage:** Import `DatabaseModule` in your feature module if you need direct access, but typically `TypeOrmModule.forFeature([Entity])` is sufficient.

### 4. Typed Configuration
Environment variables are type-safe via `ConfigService`.
**Usage:** Inject `ConfigService` and use `configService.get('database.host')`.

### 5. Current User Decorator
Access the authenticated user in controllers easily.
**Usage:**
```typescript
@Get()
getProfile(@CurrentUser() user: User) { ... }
```

**Total Endpoints**: 39+ across 4 domain modules
**Implementation Progress**: ~25% (foundation + documentation)

## Features

- **Telematics Module**: Real-time GPS tracking, battery monitoring, vehicle diagnostics
- **Booking Module**: Ride booking, seat reservation, schedule management
- **Fleet Operations Module**: Vehicle management, maintenance scheduling
- **Charging Infrastructure Module**: Charging station management, session tracking

## Tech Stack

- NestJS 10
- TypeORM (with PostGIS for geospatial queries)
- PostgreSQL 15+
- Redis (caching)
- AWS Timestream (time-series data for telematics)
- Temporal Client (workflow orchestration)
- WebSockets (real-time updates)

## Getting Started

### Prerequisites
- Node.js >= 20.0.0
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=volteryde

REDIS_HOST=localhost
REDIS_PORT=6379

TEMPORAL_ADDRESS=localhost:7233
```

### Running the service

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

## API Documentation

Once the service is running, visit:
- Swagger UI: http://localhost:3000/api/docs

## Module Structure

```
src/
├── telematics/          # GPS tracking, battery, diagnostics (8 endpoints + WebSocket)
├── booking/             # Booking and reservations (13 endpoints)
├── fleet-operations/    # Vehicle and fleet management (10 endpoints)
├── charging-infrastructure/  # Charging stations (8 endpoints)
├── shared/              # Shared utilities
│   ├── database/        # TypeORM, Timestream, Redis config
│   ├── guards/          # JWT auth, Internal service guard
│   └── temporal/        # Temporal client
├── app.module.ts
└── main.ts
```

## 📚 Complete Documentation

Comprehensive implementation guides are available in `/docs/`:

1. **[NESTJS_IMPLEMENTATION_PLAN.md](../../docs/NESTJS_IMPLEMENTATION_PLAN.md)** - Complete blueprint with all 39 endpoints
2. **[NESTJS_COMPLETION_GUIDE.md](../../docs/NESTJS_COMPLETION_GUIDE.md)** - Step-by-step implementation instructions with code examples
3. **[NESTJS_IMPLEMENTATION_PROGRESS.md](../../docs/NESTJS_IMPLEMENTATION_PROGRESS.md)** - Real-time progress tracking
4. **[NESTJS_SUMMARY.md](../../docs/NESTJS_SUMMARY.md)** - Executive summary and overview
5. **[ACTIVITIES_IMPLEMENTATION_COMPLETE.md](../../docs/ACTIVITIES_IMPLEMENTATION_COMPLETE.md)** - Temporal worker integration guide

## 🚀 Quick Start (Implementation)

1. **Install additional dependencies**:
```bash
pnpm add @aws-sdk/client-timestream-write @aws-sdk/client-timestream-query
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
pnpm add ioredis @types/ioredis @types/geojson
```

2. **Follow the Completion Guide**:
   - Start with Telematics module (foundation is complete)
   - Build Fleet Operations module
   - Build Charging Infrastructure module
   - Complete Booking internal endpoints

3. **Write tests** (Jest - required per Windsurf rules):
```bash
pnpm test              # Run all tests
pnpm test:cov         # With coverage (target >80%)
```

## 🎯 Implementation Status

| Module | Endpoints | Status |
|--------|-----------|--------|
| Telematics | 8 + WebSocket | 🚧 40% (Foundation done) |
| Fleet Operations | 10 | 📋 10% (Module scaffolded) |
| Charging | 8 | 📋 10% (Module scaffolded) |
| Booking | 13 | 🔧 30% (Needs internal endpoints) |

**Overall**: ~25% complete (foundation + documentation)

## ✅ What's Been Built

- ✅ Complete architectural design (39+ endpoints)
- ✅ Module scaffolding for all 4 domains
- ✅ AWS Timestream service (complete)
- ✅ DTOs with validation
- ✅ Internal service guard for security
- ✅ Comprehensive implementation guides
- ✅ Code examples for all patterns
- ✅ Testing strategy documented

## 🛠️ Next Steps

Follow the **Completion Guide** (`/docs/NESTJS_COMPLETION_GUIDE.md`) which provides:
- Exact code for services, controllers, and gateways
- Database setup (PostgreSQL, PostGIS, Timestream, Redis)
- WebSocket implementation
- Unit test examples
- Security implementation
