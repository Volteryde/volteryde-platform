-- ============================================================================
-- PostGIS and GTFS Database Migration Script
-- ============================================================================
-- Run this script against your PostgreSQL database to set up GTFS tables
-- Requires PostgreSQL superuser for PostGIS extension
-- 
-- Usage: psql -U postgres -d volteryde -f 001_gtfs_postgis_setup.sql
-- ============================================================================

-- Enable PostGIS extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS is enabled
SELECT PostGIS_version();

-- ============================================================================
-- GTFS Agency Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "agencyId" VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    lang VARCHAR(10),
    phone VARCHAR(50),
    "fareUrl" VARCHAR(500),
    email VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agencies_agency_id ON gtfs_agencies("agencyId");

-- ============================================================================
-- GTFS Stops Table (with PostGIS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "stopId" VARCHAR(255) NOT NULL UNIQUE,
    "stopCode" VARCHAR(50),
    "stopName" VARCHAR(255) NOT NULL,
    "stopDesc" TEXT,
    "stopLat" DECIMAL(10, 6) NOT NULL,
    "stopLon" DECIMAL(10, 6) NOT NULL,
    "zoneId" VARCHAR(100),
    "stopUrl" VARCHAR(500),
    "locationType" INTEGER DEFAULT 0,
    "parentStation" VARCHAR(255),
    "stopTimezone" VARCHAR(100),
    "wheelchairBoarding" INTEGER DEFAULT 0,
    "levelId" VARCHAR(100),
    "platformCode" VARCHAR(50),
    -- VolteRyde Extensions
    "isChargingStation" BOOLEAN DEFAULT FALSE,
    "chargingStationId" VARCHAR(255),
    "averageDwellTimeSeconds" INTEGER,
    amenities JSONB,
    -- PostGIS geometry column
    geom GEOGRAPHY(Point, 4326),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for efficient nearby queries
CREATE INDEX idx_stops_geom ON gtfs_stops USING GIST(geom);
CREATE INDEX idx_stops_stop_id ON gtfs_stops("stopId");
CREATE INDEX idx_stops_lat_lon ON gtfs_stops("stopLat", "stopLon");
CREATE INDEX idx_stops_charging ON gtfs_stops("isChargingStation") WHERE "isChargingStation" = TRUE;

-- Trigger to auto-update geometry when lat/lon changes
CREATE OR REPLACE FUNCTION update_stop_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW."stopLon", NEW."stopLat"), 4326)::geography;
    NEW."updatedAt" := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_stops_update_geometry
    BEFORE INSERT OR UPDATE OF "stopLat", "stopLon" ON gtfs_stops
    FOR EACH ROW
    EXECUTE FUNCTION update_stop_geometry();

-- ============================================================================
-- GTFS Routes Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "routeId" VARCHAR(255) NOT NULL UNIQUE,
    "agencyId" VARCHAR(255) REFERENCES gtfs_agencies("agencyId"),
    "routeShortName" VARCHAR(100),
    "routeLongName" VARCHAR(255) NOT NULL,
    "routeDesc" TEXT,
    "routeType" INTEGER DEFAULT 3,
    "routeUrl" VARCHAR(500),
    "routeColor" VARCHAR(6) DEFAULT '00FF00',
    "routeTextColor" VARCHAR(6) DEFAULT 'FFFFFF',
    "routeSortOrder" INTEGER,
    "continuousPickup" INTEGER DEFAULT 1,
    "continuousDropOff" INTEGER DEFAULT 1,
    "networkId" VARCHAR(255),
    -- VolteRyde Extensions
    "isActive" BOOLEAN DEFAULT TRUE,
    "routeDistanceKm" DECIMAL(10, 2),
    "estimatedDurationMinutes" INTEGER,
    "baseFare" DECIMAL(10, 2),
    "farePerKm" DECIMAL(10, 4),
    "routeGeometry" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_routes_route_id ON gtfs_routes("routeId");
CREATE INDEX idx_routes_agency_id ON gtfs_routes("agencyId");
CREATE INDEX idx_routes_active ON gtfs_routes("isActive");

-- ============================================================================
-- GTFS Calendar Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceId" VARCHAR(255) NOT NULL UNIQUE,
    monday BOOLEAN NOT NULL,
    tuesday BOOLEAN NOT NULL,
    wednesday BOOLEAN NOT NULL,
    thursday BOOLEAN NOT NULL,
    friday BOOLEAN NOT NULL,
    saturday BOOLEAN NOT NULL,
    sunday BOOLEAN NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    -- VolteRyde Extensions
    "serviceName" VARCHAR(255),
    description TEXT,
    "isActive" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_calendar_service_id ON gtfs_calendar("serviceId");
CREATE INDEX idx_calendar_dates ON gtfs_calendar("startDate", "endDate");

-- ============================================================================
-- GTFS Calendar Dates Table (Exceptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_calendar_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "serviceId" VARCHAR(255) REFERENCES gtfs_calendar("serviceId"),
    date DATE NOT NULL,
    "exceptionType" INTEGER NOT NULL, -- 1=added, 2=removed
    -- VolteRyde Extensions
    reason VARCHAR(255),
    "alternativeServiceId" VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("serviceId", date)
);

CREATE INDEX idx_calendar_dates_date ON gtfs_calendar_dates(date);

-- ============================================================================
-- GTFS Trips Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tripId" VARCHAR(255) NOT NULL UNIQUE,
    "routeId" VARCHAR(255) NOT NULL REFERENCES gtfs_routes("routeId"),
    "serviceId" VARCHAR(255) NOT NULL REFERENCES gtfs_calendar("serviceId"),
    "tripHeadsign" VARCHAR(255),
    "tripShortName" VARCHAR(100),
    "directionId" INTEGER,
    "blockId" VARCHAR(255), -- CRITICAL for EV range modeling
    "shapeId" VARCHAR(255),
    "wheelchairAccessible" INTEGER DEFAULT 0,
    "bikesAllowed" INTEGER DEFAULT 0,
    -- VolteRyde Extensions
    "vehicleId" VARCHAR(255),
    "driverId" VARCHAR(255),
    capacity INTEGER DEFAULT 0,
    "availableSeats" INTEGER DEFAULT 0,
    "tripDistanceKm" DECIMAL(10, 2),
    "requiredBatteryPercent" DECIMAL(5, 2),
    "estimatedEnergyConsumptionKwh" DECIMAL(10, 2),
    "isActive" BOOLEAN DEFAULT TRUE,
    "actualDepartureTime" TIMESTAMP WITH TIME ZONE,
    "delaySeconds" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trips_trip_id ON gtfs_trips("tripId");
CREATE INDEX idx_trips_route_service ON gtfs_trips("routeId", "serviceId");
CREATE INDEX idx_trips_block_id ON gtfs_trips("blockId");
CREATE INDEX idx_trips_vehicle ON gtfs_trips("vehicleId");

-- ============================================================================
-- GTFS Stop Times Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_stop_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tripId" VARCHAR(255) NOT NULL REFERENCES gtfs_trips("tripId"),
    "stopId" VARCHAR(255) NOT NULL REFERENCES gtfs_stops("stopId"),
    "arrivalTime" VARCHAR(10) NOT NULL, -- HH:MM:SS format, can exceed 24:00
    "departureTime" VARCHAR(10) NOT NULL,
    "stopSequence" INTEGER NOT NULL,
    "stopHeadsign" VARCHAR(255),
    "pickupType" INTEGER DEFAULT 0,
    "dropOffType" INTEGER DEFAULT 0,
    timepoint INTEGER DEFAULT 1,
    "shapeDistTraveled" DECIMAL(10, 2),
    -- VolteRyde Extensions
    "estimatedDwellSeconds" INTEGER,
    "distanceFromPreviousKm" DECIMAL(10, 2),
    "expectedBatteryAtStop" DECIMAL(5, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tripId", "stopSequence")
);

CREATE INDEX idx_stop_times_trip_seq ON gtfs_stop_times("tripId", "stopSequence");
CREATE INDEX idx_stop_times_stop_arrival ON gtfs_stop_times("stopId", "arrivalTime");

-- ============================================================================
-- Trip Segments Table (for Segment-Based Inventory)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_trip_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tripId" VARCHAR(255) NOT NULL REFERENCES gtfs_trips("tripId"),
    sequence INTEGER NOT NULL,
    "fromStopId" VARCHAR(255) NOT NULL REFERENCES gtfs_stops("stopId"),
    "toStopId" VARCHAR(255) NOT NULL REFERENCES gtfs_stops("stopId"),
    capacity INTEGER NOT NULL,
    "reservedSeats" INTEGER DEFAULT 0,
    "distanceKm" DECIMAL(10, 2),
    "durationSeconds" INTEGER,
    "segmentFare" DECIMAL(10, 2),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("tripId", sequence)
);

CREATE INDEX idx_segments_trip_seq ON gtfs_trip_segments("tripId", sequence);
CREATE INDEX idx_segments_stops ON gtfs_trip_segments("fromStopId", "toStopId");

-- ============================================================================
-- Segment Reservations Table
-- ============================================================================
CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'USED');

CREATE TABLE IF NOT EXISTS gtfs_segment_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "segmentId" UUID NOT NULL REFERENCES gtfs_trip_segments(id),
    "bookingId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    status reservation_status DEFAULT 'PENDING',
    "seatCount" INTEGER DEFAULT 1,
    "seatNumber" VARCHAR(20),
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "confirmedAt" TIMESTAMP WITH TIME ZONE,
    "usedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_booking ON gtfs_segment_reservations("bookingId");
CREATE INDEX idx_reservations_segment_status ON gtfs_segment_reservations("segmentId", status);
CREATE INDEX idx_reservations_user ON gtfs_segment_reservations("userId");

-- ============================================================================
-- Data Version Tracking Table (for Differential Sync)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gtfs_data_versions (
    id SERIAL PRIMARY KEY,
    version INTEGER NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- stops, routes, trips, etc.
    operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    entity_id VARCHAR(255) NOT NULL,
    changed_data JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_versions_version ON gtfs_data_versions(version);
CREATE INDEX idx_versions_entity ON gtfs_data_versions(entity_type, entity_id);

-- Function to track changes for sync
CREATE OR REPLACE FUNCTION track_gtfs_changes()
RETURNS TRIGGER AS $$
DECLARE
    current_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version), 0) + 1 INTO current_version FROM gtfs_data_versions;
    
    IF TG_OP = 'DELETE' THEN
        INSERT INTO gtfs_data_versions (version, entity_type, operation, entity_id)
        VALUES (current_version, TG_TABLE_NAME, 'DELETE', OLD.id::text);
        RETURN OLD;
    ELSE
        INSERT INTO gtfs_data_versions (version, entity_type, operation, entity_id, changed_data)
        VALUES (current_version, TG_TABLE_NAME, TG_OP, NEW.id::text, to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply change tracking to main tables
CREATE TRIGGER tr_stops_track_changes
    AFTER INSERT OR UPDATE OR DELETE ON gtfs_stops
    FOR EACH ROW EXECUTE FUNCTION track_gtfs_changes();

CREATE TRIGGER tr_routes_track_changes
    AFTER INSERT OR UPDATE OR DELETE ON gtfs_routes
    FOR EACH ROW EXECUTE FUNCTION track_gtfs_changes();

CREATE TRIGGER tr_calendar_track_changes
    AFTER INSERT OR UPDATE OR DELETE ON gtfs_calendar
    FOR EACH ROW EXECUTE FUNCTION track_gtfs_changes();

-- ============================================================================
-- Helper Views
-- ============================================================================

-- View for nearby stops with distance calculation placeholder
CREATE OR REPLACE VIEW v_stops_with_info AS
SELECT 
    s.*,
    CASE WHEN s."isChargingStation" THEN 'Charging Available' ELSE NULL END as charging_status
FROM gtfs_stops s;

-- View for active trips with route info
CREATE OR REPLACE VIEW v_active_trips AS
SELECT 
    t.*,
    r."routeShortName",
    r."routeLongName",
    r."routeColor",
    r."baseFare"
FROM gtfs_trips t
JOIN gtfs_routes r ON t."routeId" = r."routeId"
WHERE t."isActive" = TRUE AND r."isActive" = TRUE;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'GTFS Database Migration Complete!';
    RAISE NOTICE 'Tables created: gtfs_agencies, gtfs_stops, gtfs_routes, gtfs_calendar, gtfs_calendar_dates, gtfs_trips, gtfs_stop_times, gtfs_trip_segments, gtfs_segment_reservations, gtfs_data_versions';
    RAISE NOTICE 'PostGIS Version: %', PostGIS_version();
END $$;
