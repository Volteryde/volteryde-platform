# @volteryde/config

Centralized environment configuration package for the entire Volteryde platform.

## Purpose

This package provides a **single source of truth** for all environment variables across:
- Backend services (Java Spring Boot, NestJS)
- Workers (Temporal)
- Frontend applications (React, React Native)
- Infrastructure tooling

## Features

- ✅ **Type-safe** environment variables with Zod validation
- ✅ **Centralized** configuration - one place to manage all env vars
- ✅ **Validated** on startup - fails fast if misconfigured
- ✅ **Helper functions** for common operations
- ✅ **Feature flags** built-in

## Installation

This package is already included in the monorepo workspace.

```bash
# Already available via workspace
import { env } from '@volteryde/config';
```

## Usage

### Basic Usage

```typescript
import { env } from '@volteryde/config';

// Access environment variables
console.log(env.DATABASE_HOST); // localhost
console.log(env.PORT); // 3000
console.log(env.NODE_ENV); // development
```

### Database Connection

```typescript
import { getDatabaseUrl } from '@volteryde/config';

const dbUrl = getDatabaseUrl();
// postgresql://postgres:postgres@localhost:5432/volteryde
```

### Redis Connection

```typescript
import { getRedisUrl } from '@volteryde/config';

const redisUrl = getRedisUrl();
// redis://localhost:6379
```

### Environment Checks

```typescript
import { isProduction, isDevelopment } from '@volteryde/config';

if (isProduction()) {
  // Enable production features
}

if (isDevelopment()) {
  // Enable dev tools
}
```

### CORS Origins

```typescript
import { getCorsOrigins } from '@volteryde/config';

app.enableCors({
  origin: getCorsOrigins(),
  credentials: true,
});
```

### Feature Flags

```typescript
import { featureFlags } from '@volteryde/config';

if (featureFlags.isTemporalEnabled()) {
  // Use Temporal workflows
}

if (featureFlags.isRedisCacheEnabled()) {
  // Enable Redis caching
}
```

## Environment Variables

All environment variables are defined in the root `.env` file and validated by this package.

### Required Variables

- `NODE_ENV` - Environment (development, staging, production)
- `PORT` - Application port

### Database

- `DATABASE_HOST` - PostgreSQL host
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_NAME` - Database name
- `DATABASE_USERNAME` - Database user
- `DATABASE_PASSWORD` - Database password

### Redis

- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port

### Temporal

- `TEMPORAL_ADDRESS` - Temporal server address
- `TEMPORAL_NAMESPACE` - Temporal namespace

### Security

- `JWT_SECRET` - JWT signing secret
- `JWT_ISSUER_URI` - JWT issuer
- `JWT_EXPIRATION` - Token expiration time

### External Services

- `PAYSTACK_SECRET_KEY` - Paystack API key
- `TWILIO_ACCOUNT_SID` - Twilio account
- `SENDGRID_API_KEY` - SendGrid API key

## Validation

The package uses Zod for runtime validation. If any required environment variable is missing or invalid, the application will fail to start with a clear error message.

```typescript
❌ Invalid environment variables:
{
  DATABASE_HOST: ['Required'],
  JWT_SECRET: ['Required']
}
```

## Adding New Variables

1. Edit `packages/config/src/env.ts`
2. Add the variable to the `envSchema` object
3. Rebuild the package: `pnpm --filter @volteryde/config build`
4. Update the root `.env.example` file

## Type Safety

All environment variables are fully typed:

```typescript
import { env, type Env } from '@volteryde/config';

// env is typed as Env
const port: string = env.PORT; // ✅ Type-safe
const invalid = env.INVALID_VAR; // ❌ TypeScript error
```
