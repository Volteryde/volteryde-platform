-- ============================================================================
-- GTFS Seed Data for Ghana Transit Operations
-- ============================================================================
-- Sample data for testing the GTFS service
-- Run after 001_gtfs_postgis_setup.sql
--
-- Usage: psql -U postgres -d volteryde -f 002_gtfs_seed_data.sql
-- ============================================================================

-- ============================================================================
-- Agency Data
-- ============================================================================
INSERT INTO gtfs_agencies ("agencyId", name, url, timezone, lang, phone, email)
VALUES (
    'VOLTERYDE',
    'VolteRyde Ghana',
    'https://volteryde.com',
    'Africa/Accra',
    'en',
    '+233-302-123456',
    'support@volteryde.com'
) ON CONFLICT ("agencyId") DO NOTHING;

-- ============================================================================
-- Calendar (Service Patterns)
-- ============================================================================
INSERT INTO gtfs_calendar ("serviceId", monday, tuesday, wednesday, thursday, friday, saturday, sunday, "startDate", "endDate", "serviceName", description, "isActive")
VALUES 
    ('WEEKDAY', TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, '2026-01-01', '2026-12-31', 'Weekday Service', 'Regular service Monday through Friday', TRUE),
    ('WEEKEND', FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE, '2026-01-01', '2026-12-31', 'Weekend Service', 'Reduced service Saturday and Sunday', TRUE),
    ('DAILY', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, '2026-01-01', '2026-12-31', 'Daily Service', 'Service every day of the week', TRUE)
ON CONFLICT ("serviceId") DO NOTHING;

-- ============================================================================
-- Stops (Accra Metropolitan Area)
-- ============================================================================
INSERT INTO gtfs_stops ("stopId", "stopCode", "stopName", "stopDesc", "stopLat", "stopLon", "zoneId", "locationType", "isChargingStation", amenities)
VALUES 
    -- Route 101: Accra Central to Tema Station
    ('STOP-ACC-001', 'ACC', 'Accra Central Station', 'Main terminal at Accra city center', 5.5502, -0.2174, 'ZONE-A', 1, TRUE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": true}'),
    ('STOP-KIN-002', 'KIN', 'Kinbu Gardens', 'Stop at Kinbu Gardens junction', 5.5530, -0.2085, 'ZONE-A', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": false, "ticketMachine": false}'),
    ('STOP-OSU-003', 'OSU', 'Osu Oxford Street', 'Popular commercial area stop', 5.5576, -0.1815, 'ZONE-A', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": false}'),
    ('STOP-LAB-004', 'LAB', 'Labadi Beach', 'Stop near Labadi Beach', 5.5631, -0.1547, 'ZONE-B', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": false, "ticketMachine": false}'),
    ('STOP-TES-005', 'TES', 'Teshie Nungua', 'Teshie-Nungua junction', 5.5789, -0.1024, 'ZONE-B', 0, TRUE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": true}'),
    ('STOP-TEM-006', 'TEM', 'Tema Station', 'Main Tema transportation hub', 5.6698, -0.0167, 'ZONE-C', 1, TRUE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": true}'),
    
    -- Route 102: Circle to Legon
    ('STOP-CIR-007', 'CIR', 'Kwame Nkrumah Circle', 'Major interchange at Circle', 5.5713, -0.2209, 'ZONE-A', 1, TRUE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": true}'),
    ('STOP-37M-008', '37M', '37 Military Hospital', 'Stop at 37 Military Hospital', 5.5828, -0.1976, 'ZONE-A', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": false, "ticketMachine": false}'),
    ('STOP-EAS-009', 'EAS', 'East Legon', 'East Legon residential area', 5.6114, -0.1619, 'ZONE-B', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": false, "ticketMachine": false}'),
    ('STOP-LEG-010', 'LEG', 'University of Ghana', 'Legon campus main gate', 5.6508, -0.1880, 'ZONE-B', 1, TRUE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": true}'),
    
    -- Route 103: Madina to Adenta
    ('STOP-MAD-011', 'MAD', 'Madina Market', 'Busy market area stop', 5.6725, -0.1647, 'ZONE-B', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": false}'),
    ('STOP-ADE-012', 'ADE', 'Adenta SSNIT Flats', 'Adenta residential stop', 5.7102, -0.1575, 'ZONE-C', 0, FALSE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": false, "ticketMachine": false}'),
    ('STOP-ADH-013', 'ADH', 'Adenta Housing Down', 'Final stop in Adenta', 5.7234, -0.1498, 'ZONE-C', 1, TRUE, '{"shelter": true, "bench": true, "lighting": true, "realtimeDisplay": true, "ticketMachine": true}')
ON CONFLICT ("stopId") DO NOTHING;

-- ============================================================================
-- Routes
-- ============================================================================
INSERT INTO gtfs_routes ("routeId", "agencyId", "routeShortName", "routeLongName", "routeDesc", "routeType", "routeColor", "routeTextColor", "routeSortOrder", "isActive", "routeDistanceKm", "estimatedDurationMinutes", "baseFare", "farePerKm")
VALUES 
    ('RT-101', 'VOLTERYDE', '101', 'Accra Central - Tema', 'Express service from downtown Accra to Tema industrial area', 3, '00AA55', 'FFFFFF', 1, TRUE, 25.5, 45, 5.00, 0.40),
    ('RT-102', 'VOLTERYDE', '102', 'Circle - Legon', 'Campus connector via East Legon', 3, '3366FF', 'FFFFFF', 2, TRUE, 12.8, 35, 3.50, 0.45),
    ('RT-103', 'VOLTERYDE', '103', 'Madina - Adenta', 'Suburban service to Adenta', 3, 'FF6600', 'FFFFFF', 3, TRUE, 8.2, 25, 2.50, 0.50)
ON CONFLICT ("routeId") DO NOTHING;

-- ============================================================================
-- Trips (Sample trips for today and tomorrow)
-- ============================================================================
INSERT INTO gtfs_trips ("tripId", "routeId", "serviceId", "tripHeadsign", "directionId", "blockId", capacity, "availableSeats", "tripDistanceKm", "requiredBatteryPercent", "isActive")
VALUES 
    -- Route 101 trips
    ('TRIP-101-0600', 'RT-101', 'WEEKDAY', 'Tema Station', 0, 'BLOCK-A1', 40, 40, 25.5, 45.0, TRUE),
    ('TRIP-101-0700', 'RT-101', 'WEEKDAY', 'Tema Station', 0, 'BLOCK-A2', 40, 38, 25.5, 45.0, TRUE),
    ('TRIP-101-0800', 'RT-101', 'WEEKDAY', 'Tema Station', 0, 'BLOCK-A3', 40, 35, 25.5, 45.0, TRUE),
    ('TRIP-101-0900', 'RT-101', 'WEEKDAY', 'Tema Station', 0, 'BLOCK-A1', 40, 40, 25.5, 45.0, TRUE),
    ('TRIP-101-1000', 'RT-101', 'WEEKDAY', 'Tema Station', 0, 'BLOCK-A2', 40, 40, 25.5, 45.0, TRUE),
    -- Return trips
    ('TRIP-101-0630R', 'RT-101', 'WEEKDAY', 'Accra Central', 1, 'BLOCK-A1', 40, 40, 25.5, 45.0, TRUE),
    ('TRIP-101-0730R', 'RT-101', 'WEEKDAY', 'Accra Central', 1, 'BLOCK-A2', 40, 36, 25.5, 45.0, TRUE),
    
    -- Route 102 trips
    ('TRIP-102-0630', 'RT-102', 'WEEKDAY', 'University of Ghana', 0, 'BLOCK-B1', 35, 35, 12.8, 25.0, TRUE),
    ('TRIP-102-0730', 'RT-102', 'WEEKDAY', 'University of Ghana', 0, 'BLOCK-B2', 35, 30, 12.8, 25.0, TRUE),
    ('TRIP-102-0830', 'RT-102', 'WEEKDAY', 'University of Ghana', 0, 'BLOCK-B1', 35, 35, 12.8, 25.0, TRUE),
    
    -- Route 103 trips
    ('TRIP-103-0700', 'RT-103', 'DAILY', 'Adenta Housing', 0, 'BLOCK-C1', 30, 30, 8.2, 18.0, TRUE),
    ('TRIP-103-0800', 'RT-103', 'DAILY', 'Adenta Housing', 0, 'BLOCK-C2', 30, 28, 8.2, 18.0, TRUE)
ON CONFLICT ("tripId") DO NOTHING;

-- ============================================================================
-- Stop Times (Schedule)
-- ============================================================================
-- Route 101 (Accra Central to Tema)
INSERT INTO gtfs_stop_times ("tripId", "stopId", "arrivalTime", "departureTime", "stopSequence", "distanceFromPreviousKm")
VALUES 
    -- Trip 101-0900
    ('TRIP-101-0900', 'STOP-ACC-001', '09:00:00', '09:02:00', 0, 0),
    ('TRIP-101-0900', 'STOP-KIN-002', '09:08:00', '09:09:00', 1, 2.1),
    ('TRIP-101-0900', 'STOP-OSU-003', '09:18:00', '09:20:00', 2, 3.5),
    ('TRIP-101-0900', 'STOP-LAB-004', '09:28:00', '09:29:00', 3, 3.2),
    ('TRIP-101-0900', 'STOP-TES-005', '09:38:00', '09:40:00', 4, 5.8),
    ('TRIP-101-0900', 'STOP-TEM-006', '09:55:00', '09:55:00', 5, 10.9)
ON CONFLICT ("tripId", "stopSequence") DO NOTHING;

-- Route 102 (Circle to Legon)
INSERT INTO gtfs_stop_times ("tripId", "stopId", "arrivalTime", "departureTime", "stopSequence", "distanceFromPreviousKm")
VALUES 
    -- Trip 102-0730
    ('TRIP-102-0730', 'STOP-CIR-007', '07:30:00', '07:32:00', 0, 0),
    ('TRIP-102-0730', 'STOP-37M-008', '07:42:00', '07:43:00', 1, 2.8),
    ('TRIP-102-0730', 'STOP-EAS-009', '07:55:00', '07:57:00', 2, 4.5),
    ('TRIP-102-0730', 'STOP-LEG-010', '08:10:00', '08:10:00', 3, 5.5)
ON CONFLICT ("tripId", "stopSequence") DO NOTHING;

-- Route 103 (Madina to Adenta)
INSERT INTO gtfs_stop_times ("tripId", "stopId", "arrivalTime", "departureTime", "stopSequence", "distanceFromPreviousKm")
VALUES 
    -- Trip 103-0800
    ('TRIP-103-0800', 'STOP-MAD-011', '08:00:00', '08:02:00', 0, 0),
    ('TRIP-103-0800', 'STOP-ADE-012', '08:15:00', '08:16:00', 1, 5.2),
    ('TRIP-103-0800', 'STOP-ADH-013', '08:25:00', '08:25:00', 2, 3.0)
ON CONFLICT ("tripId", "stopSequence") DO NOTHING;

-- ============================================================================
-- Trip Segments (for Segment-Based Inventory)
-- ============================================================================
-- Generate segments for Route 101, Trip 0900
INSERT INTO gtfs_trip_segments ("tripId", sequence, "fromStopId", "toStopId", capacity, "reservedSeats", "distanceKm", "durationSeconds", "segmentFare")
VALUES 
    ('TRIP-101-0900', 0, 'STOP-ACC-001', 'STOP-KIN-002', 40, 0, 2.1, 360, 1.50),
    ('TRIP-101-0900', 1, 'STOP-KIN-002', 'STOP-OSU-003', 40, 0, 3.5, 540, 2.00),
    ('TRIP-101-0900', 2, 'STOP-OSU-003', 'STOP-LAB-004', 40, 0, 3.2, 480, 1.80),
    ('TRIP-101-0900', 3, 'STOP-LAB-004', 'STOP-TES-005', 40, 0, 5.8, 600, 2.80),
    ('TRIP-101-0900', 4, 'STOP-TES-005', 'STOP-TEM-006', 40, 0, 10.9, 900, 4.90)
ON CONFLICT ("tripId", sequence) DO NOTHING;

-- Generate segments for Route 102, Trip 0730
INSERT INTO gtfs_trip_segments ("tripId", sequence, "fromStopId", "toStopId", capacity, "reservedSeats", "distanceKm", "durationSeconds", "segmentFare")
VALUES 
    ('TRIP-102-0730', 0, 'STOP-CIR-007', 'STOP-37M-008', 35, 5, 2.8, 600, 1.75),
    ('TRIP-102-0730', 1, 'STOP-37M-008', 'STOP-EAS-009', 35, 5, 4.5, 720, 2.25),
    ('TRIP-102-0730', 2, 'STOP-EAS-009', 'STOP-LEG-010', 35, 5, 5.5, 780, 2.50)
ON CONFLICT ("tripId", sequence) DO NOTHING;

-- Generate segments for Route 103, Trip 0800
INSERT INTO gtfs_trip_segments ("tripId", sequence, "fromStopId", "toStopId", capacity, "reservedSeats", "distanceKm", "durationSeconds", "segmentFare")
VALUES 
    ('TRIP-103-0800', 0, 'STOP-MAD-011', 'STOP-ADE-012', 30, 2, 5.2, 780, 2.00),
    ('TRIP-103-0800', 1, 'STOP-ADE-012', 'STOP-ADH-013', 30, 2, 3.0, 540, 1.25)
ON CONFLICT ("tripId", sequence) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
DECLARE
    stop_count INTEGER;
    route_count INTEGER;
    trip_count INTEGER;
    segment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO stop_count FROM gtfs_stops;
    SELECT COUNT(*) INTO route_count FROM gtfs_routes;
    SELECT COUNT(*) INTO trip_count FROM gtfs_trips;
    SELECT COUNT(*) INTO segment_count FROM gtfs_trip_segments;
    
    RAISE NOTICE 'GTFS Seed Data Loaded Successfully!';
    RAISE NOTICE 'Stops: %, Routes: %, Trips: %, Segments: %', stop_count, route_count, trip_count, segment_count;
END $$;
