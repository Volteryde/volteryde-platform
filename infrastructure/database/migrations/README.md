# GTFS Database Migrations

This directory contains SQL migration scripts for setting up the GTFS transit data layer with PostGIS support.

## Prerequisites

- PostgreSQL 14+ with PostGIS extension available
- Superuser access (for creating extensions)

## Migration Files

| File | Description |
|------|-------------|
| `001_gtfs_postgis_setup.sql` | Creates PostGIS extension and all GTFS tables |
| `002_gtfs_seed_data.sql` | Sample Ghana transit data for testing |

## Running Migrations

### Option 1: Fresh Docker Setup

When running `docker-compose up` for the first time, PostgreSQL will automatically enable PostGIS via the updated `init-db.sh` script.

### Option 2: Manual Execution

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost -p 5432

# Run migrations
\i infrastructure/database/migrations/001_gtfs_postgis_setup.sql
\i infrastructure/database/migrations/002_gtfs_seed_data.sql
```

### Option 3: Using psql directly

```bash
# Create extension and tables
psql -U postgres -d booking_db -f infrastructure/database/migrations/001_gtfs_postgis_setup.sql

# Load seed data
psql -U postgres -d booking_db -f infrastructure/database/migrations/002_gtfs_seed_data.sql
```

## Verifying PostGIS

```sql
SELECT PostGIS_version();
-- Should return something like: 3.3 USE_GEOS=1 USE_PROJ=1 USE_STATS=1
```

## Sample Queries

### Find nearby stops (500m radius)
```sql
SELECT 
    "stopId", 
    "stopName",
    ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(-0.187, 5.6037), 4326)::geography) as distance_m
FROM gtfs_stops
WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(-0.187, 5.6037), 4326)::geography, 500)
ORDER BY distance_m;
```

### Check segment availability
```sql
SELECT 
    s."fromStopId",
    s."toStopId",
    s.capacity - s."reservedSeats" as available
FROM gtfs_trip_segments s
WHERE s."tripId" = 'TRIP-101-0900'
ORDER BY s.sequence;
```

## Tables Created

- `gtfs_agencies` - Transit operators
- `gtfs_stops` - Bus stops with PostGIS geometry
- `gtfs_routes` - Transit routes
- `gtfs_calendar` - Service patterns
- `gtfs_calendar_dates` - Service exceptions
- `gtfs_trips` - Scheduled trips
- `gtfs_stop_times` - Arrival/departure times
- `gtfs_trip_segments` - Segment inventory
- `gtfs_segment_reservations` - Booking segments
- `gtfs_data_versions` - Change tracking for sync
