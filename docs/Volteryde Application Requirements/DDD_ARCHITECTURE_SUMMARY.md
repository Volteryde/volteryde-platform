# Volteryde Domain-Driven Design (DDD) Architecture

## ✅ Architecture Validation

Your proposed DDD structure is **ARCHITECTURALLY SOUND** and follows best practices for microservices. Here's the implementation summary:

---

## Core Domain Boundaries

### 1️⃣ VEHICLE & TELEMATICS DOMAIN (Single Source of Truth)
**Purpose**: Real-time vehicle data ingestion, normalization, and event publishing

**Database Strategy**:
- **InfluxDB / TimescaleDB**: Time-series data (GPS history, battery levels, diagnostics over time)
- **Redis**: Current state cache (latest location, current battery %, active geofences)
- **Write-Optimized**: High-frequency inserts (IoT streams)

**Services**:
- GPS Location Service
- Battery Service  
- Diagnostics Service
- Telemetry Aggregator

**Key Responsibilities**:
- ✅ Ingest IoT data from vehicles
- ✅ Normalize and validate telemetry
- ✅ Store time-series data efficiently
- ✅ Publish real-time events to Kafka/RabbitMQ
- ✅ Provide REST API for current vehicle state
- ✅ Implement geofencing logic

**Does NOT Own**:
- ❌ Fleet schedules (Fleet Operations Domain)
- ❌ Maintenance decisions (Fleet Operations Domain)
- ❌ Charging reservations (Charging Infrastructure Domain)

**API Endpoints**:
```
GET /vehicles/{busId}/location          → Current GPS coordinates
GET /vehicles/{busId}/battery           → Current battery %
GET /vehicles/{busId}/diagnostics       → Error codes, motor status
GET /vehicles/{busId}/telemetry/history → Time-range queries
WS  /vehicles/{busId}/stream            → Real-time WebSocket updates
```

---

### 2️⃣ FLEET OPERATIONS DOMAIN (Business Logic Consumer)
**Purpose**: Consumes telemetry to provide analytics, maintenance scheduling, and operational insights

**Database Strategy**:
- **PostgreSQL**: Business data (vehicle_assignments, maintenance_schedules, fleet_metrics)
- **Redis**: Aggregated stats cache (reports, recent analytics)
- **Read-Optimized**: Complex analytical queries

**Services**:
- Vehicle Management Service
- Maintenance Service
- Fleet Analytics Service
- Fleet Reporting Service

**Key Responsibilities**:
- ✅ Vehicle roster and assignments
- ✅ Maintenance scheduling and tracking
- ✅ Fleet analytics and reporting
- ✅ Cost calculations
- ✅ Utilization metrics

**Consumes From**:
- Vehicle & Telematics Domain (battery health, diagnostics, location history)
- Charging Infrastructure Domain (charging events, costs)

**Does NOT Own**:
- ❌ Raw telemetry data (Telematics Domain owns this)
- ❌ Charging hardware management (Charging Infrastructure owns this)

**API Endpoints**:
```
GET  /fleet/vehicles                           → All vehicles with status
GET  /fleet/maintenance/due                    → Upcoming maintenance
POST /fleet/vehicles/{id}/schedule-maintenance → Schedule maintenance
GET  /fleet/analytics/utilization              → Usage metrics
GET  /fleet/reports/cost-breakdown             → Cost analysis
```

---

### 3️⃣ CHARGING INFRASTRUCTURE DOMAIN (Independent)
**Purpose**: Manages charging stations, reservations, and sessions

**Database Strategy**:
- **PostgreSQL**: Stations, reservations, sessions, pricing_rules
- **Redis**: Station availability cache, reservation slots

**Services**:
- Charging Station Service
- Reservation Service
- Charging Session Service
- Charging Analytics

**Key Responsibilities**:
- ✅ Charging station management
- ✅ Reservation system
- ✅ Charging session tracking
- ✅ Pricing logic
- ✅ Availability calendar

**Consumes From**:
- Vehicle & Telematics Domain (battery level for optimization)
- Fleet Operations Domain (charging requests from fleet manager)

**API Endpoints**:
```
GET  /charging/stations               → All stations with availability
POST /charging/reservations           → Reserve a charging slot
GET  /charging/stations/{id}/schedule → Station availability calendar
GET  /charging/history                → Past charging sessions
POST /charging/sessions/start         → Begin charging session
PUT  /charging/sessions/{id}/end      → End charging session
```

---

### 4️⃣ BOOKING & DISPATCH DOMAIN
**Purpose**: Bus discovery, seat allocation, and ride booking

**Database Strategy**:
- **PostgreSQL**: Bookings, routes, schedules, seat allocations
- **Redis**: Real-time seat availability, active bookings
- **PostGIS**: Geospatial queries for bus discovery

**Services**:
- Bus Discovery Service
- Seat Map Service
- Seat Booking Service
- Boarding Detection Service
- Drop-off Detection Service
- Active Booking Tracking

**Consumes From**:
- Vehicle & Telematics Domain (real-time GPS for tracking)
- Payment Domain (payment confirmation)

---

### 5️⃣ PAYMENT DOMAIN (Java - Enterprise Security)
**Purpose**: Secure payment processing, wallets, and financial transactions

**Database Strategy**:
- **PostgreSQL**: Transactions, wallets, ledger, invoices
- **Redis**: Payment session state

**Services**:
- Payment Processing Service (Paystack integration)
- Wallet Service
- Fare Calculation Service
- Invoice Generation Service
- Refund Service
- Payment Analytics

**Why Java?**:
- ✅ Spring Security for PCI compliance
- ✅ Robust transaction management
- ✅ Enterprise-grade reliability
- ✅ Strong typing for financial operations
- ✅ Better audit trails

---

### 6️⃣ AUTHENTICATION & USER MANAGEMENT DOMAIN (Java)
**Purpose**: Centralized authentication, authorization, and user profiles

**Database Strategy**:
- **PostgreSQL**: Users, roles, sessions, OAuth providers
- **Redis**: Session cache, JWT blacklist

**Services**:
- User Authentication Service
- OAuth2 Provider Service
- RBAC System
- MFA Service
- Session Management
- Profile Services (Passenger, Driver, Fleet Manager)

---

## Event-Driven Architecture

### Event Bus Strategy (Kafka/RabbitMQ)

**Published Topics**:

```yaml
# Telematics Domain Events
telematics.vehicle-location:
  - Subscribers: Dispatcher, Driver App, Booking Service
  - Frequency: High (every 5-10 seconds)
  - Payload: { busId, lat, lng, speed, heading, timestamp }

telematics.battery-updated:
  - Subscribers: Fleet Operations, Charging Infrastructure, Alerts
  - Frequency: Medium (every 30 seconds)
  - Payload: { busId, batteryPercent, health, chargeRate, timestamp }

telematics.diagnostics-warning:
  - Subscribers: Fleet Operations, Alerts, Support
  - Frequency: Low (on error detection)
  - Payload: { busId, errorCode, severity, description, timestamp }

# Fleet Operations Events
fleet-ops.maintenance-scheduled:
  - Subscribers: Fleet Manager Portal, Notifications
  - Payload: { vehicleId, maintenanceType, scheduledDate, cost }

# Charging Infrastructure Events
charging.reservation-confirmed:
  - Subscribers: Driver App, Fleet Operations
  - Payload: { reservationId, stationId, busId, startTime, endTime }

charging.session-completed:
  - Subscribers: Fleet Operations (cost tracking), Billing
  - Payload: { sessionId, busId, duration, energyUsed, cost }
```

### Event Bus Best Practices

✅ **Retry Logic**: Failed event processing with exponential backoff  
✅ **Dead-Letter Queues**: Unprocessable events for manual review  
✅ **Event Versioning**: Backward compatibility for schema changes  
✅ **Schema Registry**: Centralized event schema definitions  
✅ **Idempotency**: Duplicate event handling safeguards

---

## Domain Interaction Examples

### Example 1: Maintenance Alert Triggered by Telemetry

```typescript
// Step 1: Telematics Domain detects battery degradation
Telemetry Service → Publishes Event: "battery-health-degraded"
{
  busId: "bus-123",
  batteryHealth: 65%, // Below 70% threshold
  timestamp: "2025-11-03T15:30:00Z"
}

// Step 2: Fleet Operations Domain subscribes and reacts
Fleet Operations → Listens to event → Creates maintenance ticket
{
  vehicleId: "bus-123",
  type: "battery-replacement",
  priority: "high",
  estimatedCost: 5000 GHS,
  scheduledDate: "2025-11-05"
}

// Step 3: Fleet Operations publishes maintenance event
Fleet Operations → Publishes: "maintenance-scheduled"
{
  vehicleId: "bus-123",
  maintenanceType: "battery-replacement",
  scheduledDate: "2025-11-05"
}

// Step 4: Notification service alerts fleet manager
Notification Service → Subscribes → Sends alert to Fleet Manager
```

---

### Example 2: Smart Charging Reservation

```typescript
// Step 1: Fleet Operations calculates charging need
Fleet Ops → Queries Telematics: GET /vehicles/bus-456/battery
Response: { batteryPercent: 20%, health: 85% }

Fleet Ops → Calculates: 
  - Next trip: 50km in 2 hours
  - Required battery: 60%
  - Charging needed: 40%

// Step 2: Fleet Operations requests charging slot
Fleet Ops → POST /charging/reservations
{
  busId: "bus-456",
  requiredCharge: 40%,
  deadline: "2025-11-03T17:00:00Z",
  preferredStation: "downtown-hub"
}

// Step 3: Charging Infrastructure responds
Charging Domain → Validates availability → Confirms reservation
Response:
{
  reservationId: "res-789",
  stationId: "downtown-hub",
  estimatedDuration: 45 minutes,
  cost: 150 GHS
}

// Step 4: Event published for driver notification
Charging Domain → Publishes: "reservation-confirmed"
Driver App → Subscribes → Shows charging reminder
```

---

### Example 3: Real-Time Location Streaming

```typescript
// Continuous data flow from Telematics to Dispatcher

// Telematics Domain streams location
WS: /vehicles/bus-789/stream
→ Emits every 5 seconds:
{
  busId: "bus-789",
  lat: 5.6037,
  lng: -0.1870,
  speed: 45 km/h,
  heading: 180°,
  timestamp: "2025-11-03T15:32:15Z"
}

// Dispatcher App subscribes to WebSocket
Dispatcher Dashboard → Displays live bus positions on map
  - No business logic applied
  - Pure telemetry visualization
  - Calculated ETA using speed and distance
```

---

## Database Strategy Summary

| Domain | Primary DB | Cache | Optimization |
|--------|-----------|-------|--------------|
| **Telematics** | InfluxDB/TimescaleDB | Redis | Write-heavy (IoT streams) |
| **Fleet Operations** | PostgreSQL | Redis | Read-heavy (analytics) |
| **Charging Infrastructure** | PostgreSQL | Redis | Balanced (reservations + sessions) |
| **Booking & Dispatch** | PostgreSQL + PostGIS | Redis | Geospatial queries |
| **Payment** | PostgreSQL | Redis | Transaction integrity |
| **Authentication** | PostgreSQL | Redis | Session lookups |

---

## Architecture Principles

### ✅ Single Responsibility
Each domain has a clear, focused responsibility

### ✅ Separation of Concerns
- **Telematics**: Data ingestion and storage
- **Fleet Operations**: Business logic and analytics
- **Charging**: Infrastructure management

### ✅ Single Source of Truth
All vehicle state queries go to Telematics Domain

### ✅ Event-Driven Communication
Domains communicate asynchronously via Kafka/RabbitMQ

### ✅ Independent Scalability
Each domain scales based on its specific load pattern

### ✅ Technology Fit
- **Java**: Security-critical services (Auth, Payments)
- **NestJS**: Real-time and business logic services

---

## API Gateway Layer

```
┌─────────────────────────────────────────────┐
│           API Gateway (Kong/NGINX)          │
│                                             │
│  • Request routing to domains               │
│  • Rate limiting (Redis-backed)             │
│  • Authentication validation (JWT)          │
│  • Load balancing                           │
│  • SSL/TLS termination                      │
│  • API versioning (/v1, /v2)                │
│  • CORS policies                            │
│  • Request/Response transformation          │
└─────────────────────────────────────────────┘
            │
            ├──→ /vehicles/*     → Telematics Domain
            ├──→ /fleet/*        → Fleet Operations Domain
            ├──→ /charging/*     → Charging Infrastructure Domain
            ├──→ /bookings/*     → Booking & Dispatch Domain
            ├──→ /payments/*     → Payment Domain (Java)
            └──→ /auth/*         → Authentication Domain (Java)
```

---

## Deployment Considerations

### Kubernetes Namespaces
```yaml
namespaces:
  - telematics-domain
  - fleet-operations-domain
  - charging-infrastructure-domain
  - booking-dispatch-domain
  - payment-domain
  - auth-domain
  - infrastructure (API Gateway, Kafka, Redis)
```

### Scaling Strategy
- **Telematics**: Horizontal autoscaling based on IoT message queue depth
- **Fleet Operations**: Scheduled scaling for peak analytics hours
- **Charging**: Static scaling (predictable load)
- **Booking**: Dynamic scaling based on active users

---

## 🎯 Final Verdict

**✅ YES, Your DDD Approach is Correct**

**Strengths**:
1. ✅ Clear domain boundaries with single responsibilities
2. ✅ Telematics as authoritative source prevents data conflicts
3. ✅ Event-driven architecture reduces coupling
4. ✅ Independent scalability per domain
5. ✅ Technology choices match domain requirements
6. ✅ Database strategies optimized per domain workload

**One Refinement**:
Ensure robust event bus implementation with:
- Retry logic with exponential backoff
- Dead-letter queues for manual intervention
- Event schema versioning
- Clear event documentation

This architecture will scale from MVP to thousands of buses! 🚀
