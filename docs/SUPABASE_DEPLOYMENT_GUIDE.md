# Supabase PostgreSQL Deployment Guide

## Overview

The Volteryde Platform uses **Supabase PostgreSQL** as the managed database solution for all microservices. This guide covers configuration, deployment, and best practices for production environments.

## Architecture

### Database-per-Domain Pattern

Each microservice uses a dedicated PostgreSQL schema within the same Supabase database:

| Service | Schema |
|---------|--------|
| Authentication | `svc_auth` |
| Client Auth | `svc_client_auth` |
| User Management | `svc_users` |
| Payment | `svc_payment` |
| Fleet Operations | `svc_fleet` |
| Charging | `svc_charging` |
| Booking | `svc_booking` |
| Telematics | `svc_telematics` |
| Core API | `svc_core` |
| Notifications | `svc_notifications` |

### Connection Strategy

**Production**: Use Supabase Connection Pooler (PgBouncer)
- **Host**: `aws-0-sa-east-1.pooler.supabase.com`
- **Port**: `6543` (Pooler port with transaction mode)
- **Benefits**: Connection pooling, IPv4 compatibility, better performance

**Direct Connection** (for migrations/admin tasks only):
- **Host**: `db.YOUR_PROJECT_REF.supabase.co`
- **Port**: `5432`
- **Note**: IPv6 only, no connection pooling

## Configuration

### Environment Variables

#### Production (.env)

```bash
# Supabase Connection Pooler (Production)
SUPABASE_HOST=aws-0-sa-east-1.pooler.supabase.com
SUPABASE_PORT=6543
SUPABASE_DB=postgres
SUPABASE_USER=postgres.YOUR_PROJECT_REF
SUPABASE_PASSWORD=YOUR_SUPABASE_PASSWORD

# Supabase API
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Per-Service Schemas
AUTH_DATABASE_SCHEMA=svc_auth
CLIENT_AUTH_DATABASE_SCHEMA=svc_client_auth
USERS_DATABASE_SCHEMA=svc_users
PAYMENT_DATABASE_SCHEMA=svc_payment
FLEET_DATABASE_SCHEMA=svc_fleet
CHARGING_DATABASE_SCHEMA=svc_charging
BOOKING_DATABASE_SCHEMA=svc_booking
TELEMATICS_DATABASE_SCHEMA=svc_telematics
CORE_DATABASE_SCHEMA=svc_core
NOTIFICATIONS_DATABASE_SCHEMA=svc_notifications
```

#### Local Development with Docker

For local development using Docker Compose with Supabase:

```bash
# Use IPv6 proxy on host machine
SUPABASE_HOST=host.docker.internal
SUPABASE_PORT=25432  # Your local proxy port
```

### NestJS Services Configuration

All NestJS services automatically read database configuration from environment variables:

```typescript
// services/volteryde-nest/*/src/config/configuration.ts
database: {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  name: process.env.DATABASE_NAME || 'volteryde',
  schema: process.env.DATABASE_SCHEMA || 'public',
}
```

## Local Development

### Option 1: Using docker-compose.supabase.yml (Recommended)

This approach connects your local Docker services to Supabase:

```bash
# Start services with Supabase override
docker-compose -f docker-compose.yml -f docker-compose.supabase.yml up -d

# This will:
# 1. Replace local postgres with a stub
# 2. Connect all services to Supabase
# 3. Set correct schema per service
```

### Option 2: Running Services Directly

For running services outside Docker (e.g., `pnpm dev`):

```bash
# Update .env with Supabase credentials
SUPABASE_HOST=aws-0-sa-east-1.pooler.supabase.com
SUPABASE_PORT=6543
DATABASE_HOST=aws-0-sa-east-1.pooler.supabase.com
DATABASE_PORT=6543
DATABASE_USERNAME=postgres.YOUR_PROJECT_REF
DATABASE_PASSWORD=YOUR_DATABASE_PASSWORD
DATABASE_NAME=postgres

# Run service
cd services/volteryde-nest
pnpm dev
```

### IPv6 Proxy Setup (for Docker on macOS/Windows)

If using Docker and need to connect to Supabase direct connection (IPv6):

```bash
# Install and run the IPv6 proxy
node supabase-ipv6-proxy.js

# Then use in docker-compose.supabase.yml:
SUPABASE_HOST=host.docker.internal
SUPABASE_PORT=25432
```

## Kubernetes Deployment

### Prerequisites

1. **Supabase Project**: Ensure your Supabase project is set up
2. **Database Schemas**: Create all required schemas in Supabase
3. **Secrets**: Prepare database credentials

### Step 1: Create Database Schemas

Run this SQL in Supabase SQL Editor:

```sql
-- Create schemas for each service
CREATE SCHEMA IF NOT EXISTS svc_auth;
CREATE SCHEMA IF NOT EXISTS svc_client_auth;
CREATE SCHEMA IF NOT EXISTS svc_users;
CREATE SCHEMA IF NOT EXISTS svc_payment;
CREATE SCHEMA IF NOT EXISTS svc_fleet;
CREATE SCHEMA IF NOT EXISTS svc_charging;
CREATE SCHEMA IF NOT EXISTS svc_booking;
CREATE SCHEMA IF NOT EXISTS svc_telematics;
CREATE SCHEMA IF NOT EXISTS svc_core;
CREATE SCHEMA IF NOT EXISTS svc_notifications;

-- Grant permissions to postgres user
GRANT ALL PRIVILEGES ON SCHEMA svc_auth TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_client_auth TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_users TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_payment TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_fleet TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_charging TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_booking TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_telematics TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_core TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA svc_notifications TO postgres;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_client_auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_users GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_payment GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_fleet GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_charging GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_booking GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_telematics GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_core GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA svc_notifications GRANT ALL ON TABLES TO postgres;
```

### Step 2: Create Kubernetes Secrets

```bash
# Create secret with Supabase credentials
kubectl create secret generic volteryde-secrets \
  --from-literal=DATABASE_USER='postgres.YOUR_PROJECT_REF' \
  --from-literal=DATABASE_PASSWORD='YOUR_DATABASE_PASSWORD' \
  --from-literal=SUPABASE_PASSWORD='YOUR_SUPABASE_PASSWORD' \
  --from-literal=TEMPORAL_API_KEY='eyJhbGciOiJFUzI1NiIsImtpZCI6Ild2dHdhQSJ9...' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Step 3: Apply ConfigMap

The ConfigMap is already configured with Supabase connection details:

```bash
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml
```

### Step 4: Deploy Services

```bash
# Deploy NestJS services
kubectl apply -f infrastructure/kubernetes/base/nestjs-deployment.yaml

# Deploy Temporal workers
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml

# Verify deployments
kubectl get pods -l app=nestjs-service
kubectl get pods -l app=temporal-workers
```

### Step 5: Verify Database Connectivity

```bash
# Check NestJS service logs
kubectl logs -l app=nestjs-service --tail=50

# You should see successful database connection logs
# Look for: "Database connection established" or similar

# Check for errors
kubectl logs -l app=nestjs-service | grep -i "error\|failed"
```

## Database Migrations

### Running Migrations

Each NestJS service manages its own schema migrations:

```bash
# For local development
cd services/volteryde-nest/booking
pnpm migration:run

# For production (via kubectl)
kubectl exec -it deployment/nestjs-service -- npm run migration:run
```

### Creating New Migrations

```bash
cd services/volteryde-nest/booking
pnpm migration:generate -- src/migrations/AddNewTable
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Use transactions** for DDL operations
3. **Create rollback scripts** for production migrations
4. **Never drop columns** without a deprecation period
5. **Use schema-qualified names** in migrations (e.g., `svc_booking.bookings`)

## Connection Pooling

### Supabase Pooler Configuration

The Supabase Connection Pooler uses **PgBouncer** in transaction mode:

- **Max Connections**: Managed by Supabase (scales with plan)
- **Pool Mode**: Transaction (recommended for most applications)
- **Timeout**: 15 seconds
- **Port**: 6543

### Application-Side Pooling

TypeORM connection pool settings (already configured):

```typescript
// In database.module.ts
{
  type: 'postgres',
  host: configService.get('database.host'),
  port: configService.get('database.port'),
  // Connection pool settings
  extra: {
    max: 10,  // Maximum pool size per service
    min: 2,   // Minimum pool size
    idleTimeoutMillis: 30000,
  }
}
```

## Monitoring & Performance

### Supabase Dashboard

Monitor database performance in Supabase Dashboard:
- **URL**: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
- **Metrics**: Query performance, connection count, storage usage
- **Logs**: Real-time database logs

### Key Metrics to Monitor

1. **Active Connections**: Should stay below pooler limits
2. **Query Performance**: Slow queries (>1s)
3. **Schema Size**: Per-service schema storage
4. **Connection Errors**: Failed connection attempts

### Performance Optimization

1. **Use Indexes**: Create indexes on frequently queried columns
2. **Optimize Queries**: Use EXPLAIN ANALYZE for slow queries
3. **Connection Pooling**: Always use the pooler endpoint
4. **Schema Isolation**: Keep schemas separate for better performance tracking

## Security Best Practices

### 1. Credentials Management

**Production**:
- Store credentials in **AWS Secrets Manager** or **HashiCorp Vault**
- Use Kubernetes External Secrets Operator
- Rotate passwords regularly (every 90 days)

**Never**:
- Commit credentials to git
- Share credentials via chat/email
- Use the same password across environments

### 2. Network Security

- **Use SSL/TLS**: Always connect via SSL (enforced by Supabase)
- **IP Allowlisting**: Configure in Supabase dashboard if needed
- **VPC Peering**: For AWS deployments, consider VPC peering

### 3. Database Security

```sql
-- Revoke public schema access
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Grant minimal permissions per service
GRANT USAGE ON SCHEMA svc_booking TO booking_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA svc_booking TO booking_service_user;
```

### 4. Row-Level Security (RLS)

Enable RLS for sensitive tables:

```sql
-- Enable RLS on users table
ALTER TABLE svc_users.users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_isolation ON svc_users.users
  USING (auth.uid() = id);
```

## Troubleshooting

### Connection Refused

**Symptom**: `ECONNREFUSED` or `Connection refused`

**Solutions**:
1. Verify `SUPABASE_HOST` and `SUPABASE_PORT` are correct
2. Check if Supabase project is active (not paused)
3. Verify network connectivity: `telnet aws-0-sa-east-1.pooler.supabase.com 6543`
4. Check firewall rules

### Authentication Failed

**Symptom**: `password authentication failed for user "postgres.YOUR_PROJECT_REF"`

**Solutions**:
1. Verify `SUPABASE_PASSWORD` is correct
2. Check `SUPABASE_USER` format: `postgres.{project-ref}`
3. Reset password in Supabase dashboard if needed

### Schema Not Found

**Symptom**: `schema "svc_booking" does not exist`

**Solutions**:
1. Create missing schemas (see Step 1 above)
2. Verify `DATABASE_SCHEMA` environment variable is set
3. Check schema permissions

### Too Many Connections

**Symptom**: `FATAL: remaining connection slots are reserved`

**Solutions**:
1. Use the **pooler endpoint** (port 6543) instead of direct connection
2. Reduce application connection pool size
3. Upgrade Supabase plan for more connections
4. Check for connection leaks in application code

### Slow Queries

**Symptom**: Queries taking >1s to execute

**Solutions**:
1. Add indexes on frequently queried columns
2. Use `EXPLAIN ANALYZE` to identify bottlenecks
3. Optimize N+1 query patterns
4. Consider query result caching (Redis)

## Migration from Local PostgreSQL

If migrating from local PostgreSQL to Supabase:

### 1. Export Data

```bash
# Export schema and data per service
pg_dump -h localhost -U postgres -n svc_booking -f booking_schema.sql volteryde
```

### 2. Import to Supabase

```bash
# Import via psql (use direct connection)
psql "postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  -f booking_schema.sql
```



### 3. Update Application Configuration

```bash
# Update .env
SUPABASE_HOST=aws-0-sa-east-1.pooler.supabase.com
SUPABASE_PORT=6543
DATABASE_HOST=aws-0-sa-east-1.pooler.supabase.com
DATABASE_PORT=6543
```

### 4. Test Connectivity

```bash
# Test connection
cd services/volteryde-nest/booking
pnpm dev

# Verify data
# Check application logs for successful queries
```

## Backup & Recovery

### Automated Backups

Supabase provides automatic daily backups:
- **Retention**: 7 days (Free/Pro), 30 days (Team/Enterprise)
- **Location**: Supabase Dashboard → Database → Backups

### Manual Backups

```bash
# Backup specific schema
pg_dump "postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" \
  -n svc_booking \
  -f backup_$(date +%Y%m%d).sql
```

### Point-in-Time Recovery (PITR)

Available on Team/Enterprise plans:
- Enable in Supabase Dashboard → Database → Settings
- Allows recovery to any point within retention period

## Cost Optimization

### 1. Connection Pooling

Always use the pooler to reduce connection overhead:
- **Without pooler**: Each service instance = 10 connections
- **With pooler**: Shared connection pool across all instances

### 2. Query Optimization

- Add indexes to reduce query time
- Use `SELECT` specific columns instead of `SELECT *`
- Implement pagination for large result sets

### 3. Storage Management

- Archive old data to separate tables
- Use table partitioning for time-series data
- Regularly vacuum and analyze tables

### 4. Plan Selection

Monitor usage and upgrade plan as needed:
- **Free**: 500MB database, 2GB bandwidth
- **Pro**: 8GB database, 50GB bandwidth
- **Team**: 100GB database, 250GB bandwidth

## Support & Resources

### Supabase Resources
- **Documentation**: https://supabase.com/docs
- **Dashboard**: https://supabase.com/dashboard/project/YOUR_PROJECT_REF
- **Status**: https://status.supabase.com
- **Community**: https://github.com/supabase/supabase/discussions

### Volteryde Platform
- **Internal Docs**: `/docs`
- **Architecture**: `/docs/ARCHITECTURE.md`
- **Temporal Guide**: `/docs/TEMPORAL_CLOUD_MIGRATION.md`

## Checklist

### Initial Setup
- [ ] Create Supabase project
- [ ] Create all database schemas
- [ ] Configure connection pooler
- [ ] Set up IP allowlisting (if needed)
- [ ] Create database users with minimal permissions

### Local Development
- [ ] Update `.env` with Supabase credentials
- [ ] Test connection with `pnpm dev`
- [ ] Run migrations
- [ ] Verify data access per schema

### Production Deployment
- [ ] Create Kubernetes secrets with Supabase credentials
- [ ] Apply ConfigMap with Supabase endpoint
- [ ] Deploy services
- [ ] Verify database connectivity
- [ ] Run production migrations
- [ ] Set up monitoring and alerts
- [ ] Configure automated backups
- [ ] Document credentials in secrets manager

### Post-Deployment
- [ ] Monitor connection count
- [ ] Check query performance
- [ ] Set up alerting for errors
- [ ] Schedule password rotation
- [ ] Review and optimize slow queries
