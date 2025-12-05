# NestJS Service Implementation Plan - Volteryde Platform

**Date**: November 14, 2024  
**Service**: `volteryde-nest`  
**Architecture**: Single NestJS microservice with 4 domain modules

---

## 🎯 Overview

This document outlines the complete implementation of the `volteryde-nest` microservice containing **4 domain modules** with **39+ endpoints**.

### **Single Service, Multiple Modules**

We are building **ONE** NestJS microservice (`volteryde-nest`) organized into **4 powerful modules**:

1. **Booking Module** (Already exists - needs completion)
2. **Telematics Module** (NEW - 8 endpoints + WebSocket)
3. **Fleet Operations Module** (NEW - 10 endpoints)
4. **Charging Infrastructure Module** (NEW - 8 endpoints)

---

## 📋 Complete Feature List (39+ Endpoints)

### **Module 1: Telematics (8 Endpoints + WebSocket)**

**Purpose**: Real-time vehicle tracking, diagnostics, and live updates

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/v1/telematics/location/history` | GET | Get vehicle location history |
| 2 | `/api/v1/telematics/location/current/:vehicleId` | GET | Get current vehicle location |
| 3 | `/api/v1/telematics/location/track` | POST | Update vehicle location (from driver app) |
| 4 | `/api/v1/telematics/diagnostics/:vehicleId` | GET | Get vehicle diagnostics (battery, speed, etc.) |
| 5 | `/api/v1/telematics/alerts/:vehicleId` | GET | Get vehicle alerts/warnings |
| 6 | `/api/v1/telematics/geofence/check` | POST | Check if vehicle is within geofence |
| 7 | `/api/v1/telematics/trip/:tripId` | GET | Get trip data (route, stats) |
| 8 | `/api/v1/telematics/analytics/driver/:driverId` | GET | Driver behavior analytics |
| **WebSocket** | `/telematics/live` | WS | Live location and diagnostic updates |

**Database**: AWS Timestream (time-series data)

---

### **Module 2: Fleet Operations (10 Endpoints)**

**Purpose**: Vehicle management, driver assignment, maintenance scheduling

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/v1/fleet/vehicles` | GET | List all vehicles with filters |
| 2 | `/api/v1/fleet/vehicles/:id` | GET | Get vehicle details |
| 3 | `/api/v1/fleet/vehicles` | POST | Register new vehicle |
| 4 | `/api/v1/fleet/vehicles/:id` | PATCH | Update vehicle details |
| 5 | `/api/v1/fleet/vehicles/:id/status` | PATCH | Update vehicle status (active/inactive) |
| 6 | `/api/v1/fleet/drivers/available` | GET | Get available drivers |
| 7 | `/api/v1/fleet/drivers/:id/assign` | POST | Assign driver to vehicle |
| 8 | `/api/v1/fleet/maintenance/schedule` | POST | Schedule maintenance |
| 9 | `/api/v1/fleet/maintenance/:vehicleId` | GET | Get maintenance history |
| 10 | `/api/v1/fleet/utilization` | GET | Fleet utilization analytics |

**Database**: PostgreSQL (RDS)

---

### **Module 3: Charging Infrastructure (8 Endpoints)**

**Purpose**: Charging station management, session tracking, billing

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/v1/charging/stations` | GET | List charging stations with availability |
| 2 | `/api/v1/charging/stations/:id` | GET | Get station details |
| 3 | `/api/v1/charging/stations/nearby` | GET | Find nearby stations (PostGIS) |
| 4 | `/api/v1/charging/session/start` | POST | Start charging session |
| 5 | `/api/v1/charging/session/stop` | POST | Stop charging session |
| 6 | `/api/v1/charging/session/:sessionId` | GET | Get session details |
| 7 | `/api/v1/charging/session/:sessionId/cost` | GET | Calculate session cost |
| 8 | `/api/v1/charging/analytics` | GET | Charging analytics (usage, revenue) |

**Database**: PostgreSQL (RDS) + PostGIS for location

---

### **Module 4: Booking (13 Endpoints - 5 Internal + 8 Public)**

**Purpose**: Ride booking, seat management, passenger/driver notifications

#### **Internal Endpoints** (Called by Temporal Worker)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/v1/booking/internal/reserve-seat` | POST | Reserve seat (Temporal activity) |
| 2 | `/api/v1/booking/internal/confirm` | POST | Confirm booking (Temporal activity) |
| 3 | `/api/v1/booking/internal/reserve/:id` | DELETE | Release reservation (compensation) |
| 4 | `/api/v1/notifications/internal/driver` | POST | Notify driver (Temporal activity) |
| 5 | `/api/v1/notifications/internal/send` | POST | Send passenger notification |

#### **Public Endpoints** (Called by Mobile Apps)

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 6 | `/api/v1/booking` | POST | Start booking workflow |
| 7 | `/api/v1/booking/:id` | GET | Get booking details |
| 8 | `/api/v1/booking/:id/cancel` | POST | Cancel booking |
| 9 | `/api/v1/booking/user/:userId` | GET | Get user's bookings |
| 10 | `/api/v1/booking/routes` | GET | Get available routes |
| 11 | `/api/v1/booking/routes/:routeId/buses` | GET | Get buses on route |
| 12 | `/api/v1/booking/seats/:busId` | GET | Get available seats |
| 13 | `/api/v1/booking/discover` | POST | Discover buses by location (PostGIS) |

**Database**: PostgreSQL (RDS) + PostGIS + Redis (caching)

---

## 🗄️ Database Architecture

### **1. PostgreSQL (AWS RDS)**
**Used by**: Booking, Fleet Operations, Charging Infrastructure

**Tables**:
- `bookings` - Ride bookings
- `reservations` - Temporary seat reservations
- `vehicles` - Fleet vehicles
- `drivers` - Driver profiles
- `maintenance_records` - Maintenance history
- `charging_stations` - Charging station locations
- `charging_sessions` - Charging session records
- `routes` - Bus routes
- `seats` - Vehicle seat inventory

**Extensions**:
- **PostGIS** - For geospatial queries (nearby stations, bus discovery)

### **2. AWS Timestream (Time-Series)**
**Used by**: Telematics

**Tables**:
- `vehicle_locations` - GPS coordinates over time
- `vehicle_diagnostics` - Battery, speed, temperature readings
- `trip_data` - Trip statistics and metrics

### **3. Redis (AWS ElastiCache)**
**Used by**: Booking (caching)

**Keys**:
- `seat_availability:{busId}` - Real-time seat availability
- `vehicle_location:{vehicleId}` - Cached latest location
- `booking:{bookingId}` - Booking cache

---

## 📁 Project Structure

```
services/volteryde-nest/src/
├── app.module.ts               # Main application module
├── main.ts                     # Bootstrap
│
├── shared/                     # Shared modules
│   ├── database/              # Database configurations
│   │   ├── typeorm.config.ts
│   │   ├── timestream.config.ts
│   │   └── redis.config.ts
│   ├── guards/                # Security guards
│   │   └── internal-service.guard.ts
│   ├── interceptors/
│   ├── temporal/              # Temporal client
│   └── utils/
│
├── booking/                    # Booking Module
│   ├── booking.module.ts
│   ├── controllers/
│   │   ├── booking.controller.ts          # Public endpoints
│   │   └── booking-internal.controller.ts # Internal endpoints
│   ├── services/
│   │   ├── booking.service.ts
│   │   └── notification.service.ts
│   ├── entities/
│   │   ├── booking.entity.ts
│   │   └── reservation.entity.ts
│   ├── dto/
│   │   ├── create-booking.dto.ts
│   │   └── reserve-seat.dto.ts
│   └── __tests__/
│       ├── booking.service.spec.ts
│       └── booking.controller.spec.ts
│
├── telematics/                 # Telematics Module (NEW)
│   ├── telematics.module.ts
│   ├── controllers/
│   │   └── telematics.controller.ts
│   ├── gateways/
│   │   └── telematics.gateway.ts         # WebSocket
│   ├── services/
│   │   ├── telematics.service.ts
│   │   └── timestream.service.ts
│   ├── dto/
│   │   ├── location-update.dto.ts
│   │   └── diagnostics.dto.ts
│   └── __tests__/
│       ├── telematics.service.spec.ts
│       └── telematics.controller.spec.ts
│
├── fleet-operations/           # Fleet Operations Module (NEW)
│   ├── fleet-operations.module.ts
│   ├── controllers/
│   │   ├── vehicles.controller.ts
│   │   ├── drivers.controller.ts
│   │   └── maintenance.controller.ts
│   ├── services/
│   │   ├── fleet.service.ts
│   │   ├── vehicle.service.ts
│   │   ├── driver.service.ts
│   │   └── maintenance.service.ts
│   ├── entities/
│   │   ├── vehicle.entity.ts
│   │   ├── driver.entity.ts
│   │   └── maintenance-record.entity.ts
│   ├── dto/
│   │   ├── create-vehicle.dto.ts
│   │   └── schedule-maintenance.dto.ts
│   └── __tests__/
│       ├── fleet.service.spec.ts
│       └── vehicles.controller.spec.ts
│
└── charging-infrastructure/    # Charging Module (NEW)
    ├── charging-infrastructure.module.ts
    ├── controllers/
    │   ├── stations.controller.ts
    │   └── sessions.controller.ts
    ├── services/
    │   ├── charging.service.ts
    │   └── billing.service.ts
    ├── entities/
    │   ├── charging-station.entity.ts
    │   └── charging-session.entity.ts
    ├── dto/
    │   ├── start-session.dto.ts
    │   └── nearby-stations.dto.ts
    └── __tests__/
        ├── charging.service.spec.ts
        └── stations.controller.spec.ts
```

---

## 🛠️ Implementation Phases

### **Phase 1: Scaffold Modules** ✅ (Step 2 in plan)

```bash
cd services/volteryde-nest
nest g module telematics
nest g module fleet-operations
nest g module charging-infrastructure
```

### **Phase 2: Database Setup** ✅ (Step 3 in plan)

1. Configure TypeORM for PostgreSQL + PostGIS
2. Set up Timestream client for telematics
3. Configure Redis client for caching
4. Create database entities
5. Run migrations

### **Phase 3: Build Telematics** ✅ (Step 4 in plan)

1. Create controllers and services
2. Implement 8 REST endpoints
3. Create WebSocket gateway for live updates
4. Write unit tests
5. Test with Timestream

### **Phase 4: Build Fleet Operations** ✅ (Step 5 in plan)

1. Create controllers and services
2. Implement 10 REST endpoints
3. Create entities and DTOs
4. Write unit tests
5. Test database operations

### **Phase 5: Build Charging Infrastructure** ✅ (Step 6 in plan)

1. Create controllers and services
2. Implement 8 REST endpoints
3. Add PostGIS support for nearby stations
4. Write unit tests
5. Test location queries

### **Phase 6: Complete Booking Module** ✅ (Step 7 in plan)

1. Create internal controller (for Temporal)
2. Implement 5 internal endpoints
3. Implement 8 public endpoints
4. Add Redis caching
5. Write unit tests

### **Phase 7: Testing** ✅ (Step 8 in plan)

1. Unit tests for all services (Jest)
2. Integration tests for database
3. E2E tests for critical flows
4. WebSocket connection tests

### **Phase 8: Documentation** ✅ (Step 9 in plan)

1. OpenAPI/Swagger documentation
2. API usage examples
3. Postman collection
4. Architecture diagrams

### **Phase 9: Configuration** ✅ (Step 10 in plan)

1. Environment variables
2. Database connection strings
3. Security keys
4. Feature flags

---

## 🔒 Security

### **Internal Service Guard**

All internal endpoints (called by Temporal) are protected:

```typescript
@UseGuards(InternalServiceGuard)
@Controller('api/v1/booking/internal')
export class BookingInternalController {
  // Only accessible with X-Internal-Service-Key header
}
```

### **Authentication**

Public endpoints require JWT authentication:

```typescript
@UseGuards(JwtAuthGuard)
@Controller('api/v1/booking')
export class BookingController {
  // Requires valid JWT token
}
```

---

## 📊 Testing Strategy

### **Unit Tests** (REQUIRED per Windsurf rules)

```bash
cd services/volteryde-nest
pnpm test                 # Run all tests
pnpm test:cov            # With coverage
pnpm test:watch          # Watch mode
```

**Coverage Target**: 80% minimum

### **Test Files Required**:

- `*.service.spec.ts` - All services
- `*.controller.spec.ts` - All controllers
- `*.gateway.spec.ts` - WebSocket gateways

---

## 🌐 Environment Variables

```bash
# Database - PostgreSQL
DATABASE_HOST=your-rds-endpoint.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_NAME=volteryde
DATABASE_USERNAME=admin
DATABASE_PASSWORD=your-password

# Time-Series - Timestream
TIMESTREAM_DATABASE=volteryde_telematics
TIMESTREAM_TABLE_LOCATIONS=vehicle_locations
TIMESTREAM_TABLE_DIAGNOSTICS=vehicle_diagnostics
AWS_REGION=us-east-1

# Cache - Redis
REDIS_HOST=your-elasticache-endpoint.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Temporal
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_API_KEY=your-api-key

# Internal Service Security
INTERNAL_SERVICE_KEY=strong-random-key-here

# External Services
PAYSTACK_SECRET_KEY=your-paystack-key
TWILIO_ACCOUNT_SID=your-twilio-sid
SENDGRID_API_KEY=your-sendgrid-key
```

---

## ✅ Windsurf Rules Compliance

Per Windsurf rules, every feature MUST have:

### **1. ✅ Unit Tests**
- Jest tests for all services
- Coverage > 80%
- Test success AND error cases

### **2. ✅ UI Components**
- Mobile apps will consume these APIs
- Admin dashboard will use fleet/charging APIs
- Driver app will use telematics APIs

### **3. ✅ Documentation**
- This implementation plan
- OpenAPI/Swagger docs
- API usage guides
- Architecture diagrams

---

## 🚀 Deployment

### **Local Development**

```bash
# Start dependencies
docker-compose up -d postgres redis

# Start NestJS service
cd services/volteryde-nest
pnpm install
pnpm dev
```

### **Production (AWS EKS)**

- Deployed as Kubernetes pod
- Connects to RDS, Timestream, ElastiCache
- Auto-scaling based on load
- Health checks and monitoring

---

## 📈 Success Metrics

- [ ] All 39+ endpoints implemented
- [ ] All unit tests passing (>80% coverage)
- [ ] WebSocket live updates working
- [ ] Database queries optimized (<100ms)
- [ ] API documentation complete
- [ ] Integration tests passing
- [ ] Production deployment successful

---

**Status**: Ready to Implement 🚀  
**Next Step**: Begin Phase 1 - Scaffold Modules
