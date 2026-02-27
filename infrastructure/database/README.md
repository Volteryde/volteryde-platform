# Database Initialization - Quick Start Guide

## For New Team Members

All database initialization is now **fully automated**. Simply run:

```bash
docker-compose up -d postgres
```

Everything will be set up automatically including:
- ✅ All 11 application databases
- ✅ GTFS tables with seed data
- ✅ Temporal databases
- ✅ PostGIS extensions

## What's Been Fixed

Your teammates won't encounter these issues anymore:

### 1. ❌ Database Already Exists Errors
**Fixed**: Our `init-db.sh` now uses `CREATE DATABASE IF NOT EXISTS` - safe to run multiple times.

### 2. ❌ Missing GTFS Tables
**Fixed**: Migrations in `infrastructure/database/migrations/` run automatically on first startup.

### 3. ❌ Temporal Connection Failures
**Fixed**: Configured Temporal with `SKIP_DB_CREATE=true` to prevent conflicts.

## Starting the Platform

### First Time Setup
```bash
# 1. Clone the repository
git clone <repo-url>
cd volteryde-platform

# 2. Set environment variables
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD

# 3. Start all services
docker-compose up -d

# 4. Verify postgres is healthy (wait ~30 seconds)
docker ps --filter "name=volteryde-postgres"
```

### Subsequent Starts
```bash
docker-compose up -d
```

That's it! No manual database setup required.

## Verifying Your Setup

### Check Container Health
```bash
docker ps --filter "name=volteryde-postgres"
# Should show: Up X minutes (healthy)
```

### Check Databases
```bash
docker exec volteryde-postgres psql -U postgres -c "\l"
# Should list: volteryde, temporal, temporal_visibility, auth_db, etc.
```

### Check GTFS Tables
```bash
docker exec volteryde-postgres psql -U postgres -d volteryde -c "\dt gtfs_*"
# Should show 10 GTFS tables
```

## Troubleshooting

### "Database already exists" errors
**This is normal during Temporal startup.** Temporal tries to create databases that already exist. These warning messages are harmless and can be ignored.

### Container won't start
```bash
# Check logs
docker logs volteryde-postgres

# If needed, reset completely
docker-compose down -v
docker-compose up -d postgres
```

### Need to rerun migrations
Migrations only run on a **fresh database**. If you need to rerun them:
```bash
# Remove the volume
docker-compose down -v postgres_data

# Restart - migrations will run again
docker-compose up -d postgres
```

## Architecture

### Database Per Domain Strategy
Each microservice has its own database:
- `volteryde` - Main application database
- `auth_db` - Authentication service
- `user_db` - User management
- `fleet_db` - Fleet management
- `booking_db` - Booking service
- `charging_db` - Charging stations
- `payment_db` - Payment processing
- `telematics_db` - Vehicle telematics
- `temporal` - Workflow engine
- `temporal_visibility` - Temporal UI data

### Migration System
SQL migrations in `infrastructure/database/migrations/` are:
- Auto-discovered by naming pattern: `001_*.sql`, `002_*.sql`
- Executed in alphabetical order
- Run once during first container initialization
- Idempotent and safe

## Files You Might Need to Edit

### Adding New Databases
Edit [docker-compose.yml](file:///Users/kaeytee/Desktop/CODES/Volteryde/Codebase/System/volteryde-platform/docker-compose.yml):
```yaml
environment:
  POSTGRES_MULTIPLE_DATABASES: existing_dbs,your_new_db
```

### Adding New Migrations
1. Create `infrastructure/database/migrations/003_your_migration.sql`
2. Write idempotent SQL (use `IF NOT EXISTS` where applicable)
3. Restart postgres container for fresh deployment, or run manually for existing setups

---

**Questions?** Check the [full implementation details](file:///Users/kaeytee/.gemini/antigravity/brain/635c4ba7-d112-49de-b65b-1a65493d6ae6/implementation_plan.md) or [walkthrough](file:///Users/kaeytee/.gemini/antigravity/brain/635c4ba7-d112-49de-b65b-1a65493d6ae6/walkthrough.md).
