# Volteryde NestJS Backend

NestJS backend service handling Telematics, Booking, Fleet Operations, and Charging Infrastructure.

## Features

- **Telematics Module**: Real-time GPS tracking, battery monitoring, vehicle diagnostics
- **Booking Module**: Ride booking, seat reservation, schedule management
- **Fleet Operations Module**: Vehicle management, maintenance scheduling
- **Charging Infrastructure Module**: Charging station management, session tracking

## Tech Stack

- NestJS 10
- TypeORM
- PostgreSQL
- Redis
- Temporal Client

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
├── telematics/          # GPS tracking, battery, diagnostics
├── booking/             # Booking and reservations
├── fleet-operations/    # Vehicle and fleet management
├── charging/            # Charging infrastructure
├── shared/              # Shared utilities
│   ├── database/
│   ├── auth/
│   └── guards/
├── app.module.ts
└── main.ts
```
