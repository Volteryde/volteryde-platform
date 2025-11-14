# Temporal Booking Workflow - Complete Implementation Guide

## Overview

This guide documents the complete Temporal implementation for the Volteryde Platform booking system. Temporal provides **durable execution** - workflows that are fault-tolerant and guaranteed to complete even if servers crash or networks fail.

## Why Temporal?

### The Problem Without Temporal

Consider our booking flow:
1. Reserve Seat → 2. Process Payment (Paystack) → 3. Confirm Booking → 4. Notify Driver

**What happens if the server crashes after payment but before confirmation?**
- User's money is taken
- No booking exists
- **Critical business failure**

### The Solution With Temporal

Temporal workflows are **durable functions** that:
- ✅ **Resume from the last checkpoint** after crashes
- ✅ **Automatically retry** failed activities
- ✅ **Implement compensation** (Saga pattern) if steps fail
- ✅ **Provide observability** through Temporal UI

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Mobile Passenger App                        │
│                    POST /api/v1/booking                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   NestJS Backend (BookingService)                │
│         services/volteryde-nest/src/booking/                     │
│         - Validates request                                      │
│         - Starts Temporal workflow                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ temporalClient.workflow.start()
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Temporal Server                             │
│                   (localhost:7233 or hosted)                     │
│         - Orchestrates workflow execution                        │
│         - Maintains workflow state                               │
│         - Schedules activities                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ Polls for tasks
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Temporal Workers                               │
│             workers/temporal-workers/src/                        │
│         - Executes workflow code                                 │
│         - Runs activity functions                                │
│         - Reports status back to Temporal                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             │ HTTP/gRPC calls
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│              Backend Services (Activities call these)            │
│  - NestJS: Booking, Telematics, Fleet, Charging domains         │
│  - Spring Boot: Payment domain (Paystack integration)           │
└──────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Workflow
The orchestrator - **durable business logic**.
- File: `workers/temporal-workers/src/workflows/booking.workflow.ts`
- Function: `bookRideWorkflow()`
- Contains the sequence of steps and Saga compensation

### 2. Activities  
The "workhorses" - **individual actions**.
- File: `workers/temporal-workers/src/activities/booking.activities.ts`
- Functions: `reserveSeat()`, `processPayment()`, `confirmBooking()`, etc.
- Make HTTP calls to backend services
- Can be retried independently

### 3. Worker
The executor - **polls and runs workflows**.
- File: `workers/temporal-workers/src/workers/booking.worker.ts`
- Connects to Temporal server
- Executes workflow and activity code

### 4. Saga Pattern (Compensation)
If a workflow fails after payment:
- **Forward steps**: Reserve → Pay → Confirm
- **Compensation steps** (reverse order): Refund → Release

## File Structure

```
volteryde-platform/
├── workers/temporal-workers/
│   ├── src/
│   │   ├── interfaces.ts              # Shared type definitions
│   │   ├── activities/
│   │   │   └── booking.activities.ts  # Activity implementations
│   │   ├── workflows/
│   │   │   └── booking.workflow.ts    # Workflow orchestration
│   │   ├── workers/
│   │   │   └── booking.worker.ts      # Worker setup
│   │   └── index.ts                   # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── services/volteryde-nest/
│   └── src/
│       ├── shared/temporal/
│       │   ├── temporal.service.ts    # Temporal client wrapper
│       │   └── temporal.module.ts     # NestJS module
│       └── booking/
│           ├── booking.service.ts     # Starts workflows
│           ├── booking.controller.ts  # REST API endpoints
│           └── booking.module.ts      # NestJS module
│
└── docs/
    └── TEMPORAL_BOOKING_WORKFLOW_GUIDE.md  # This file
```

## Setup Instructions

### 1. Install Temporal Server

You already installed Temporal CLI via Homebrew:

```bash
# Start Temporal development server
temporal server start-dev

# Access Temporal Web UI
open http://localhost:8080
```

Or use Docker Compose (already configured):

```bash
# Start Temporal + PostgreSQL
docker-compose up temporal temporal-ui postgres
```

### 2. Install Dependencies

```bash
# Install worker dependencies
cd workers/temporal-workers
pnpm install

# Install NestJS dependencies (already has @temporalio/client)
cd ../../services/volteryde-nest
pnpm install
```

### 3. Configure Environment Variables

Update your `.env` file (copy from `.env.example`):

```bash
# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=volteryde-booking

# Service URLs (for activities)
NESTJS_API_URL=http://localhost:3000
SPRINGBOOT_API_URL=http://localhost:8080
```

## Running the System

### Terminal 1: Temporal Server

```bash
# Using CLI
temporal server start-dev

# Or using Docker Compose
docker-compose up temporal temporal-ui
```

### Terminal 2: Backend Services

```bash
# Start NestJS backend
cd services/volteryde-nest
pnpm dev

# (In another terminal) Start Spring Boot backend
cd services/volteryde-springboot
./mvnw spring-boot:run
```

### Terminal 3: Temporal Workers

```bash
# Start the workers
cd workers/temporal-workers
pnpm dev

# You should see:
# ======================================================================
# Volteryde Temporal Worker - Starting...
# ======================================================================
# Temporal Server: localhost:7233
# Task Queue: volteryde-booking
# Namespace: default
#
# ✓ Connected to Temporal server
# ✓ Worker created successfully
#
# Worker is ready and polling for tasks...
# Press Ctrl+C to stop
# ======================================================================
```

## Testing the Workflow

### 1. Create a Booking via API

```bash
curl -X POST http://localhost:3000/api/v1/booking \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "startLocation": {
      "latitude": 5.6037,
      "longitude": -0.1870,
      "address": "Accra Mall, Ghana"
    },
    "endLocation": {
      "latitude": 5.6137,
      "longitude": -0.2070,
      "address": "Korle Bu Teaching Hospital"
    },
    "vehicleType": "STANDARD",
    "passengerCount": 1
  }'
```

Response:
```json
{
  "workflowId": "booking-user-123-1731584400000",
  "runId": "abc123...",
  "status": "PROCESSING",
  "message": "Your booking is being processed"
}
```

### 2. Check Booking Status

```bash
curl http://localhost:3000/api/v1/booking/booking-user-123-1731584400000
```

Response (while processing):
```json
{
  "workflowId": "booking-user-123-1731584400000",
  "status": "PROCESSING",
  "message": "Booking is still being processed"
}
```

Response (completed):
```json
{
  "workflowId": "booking-user-123-1731584400000",
  "status": "COMPLETED",
  "booking": {
    "bookingId": "book-1731584410000-abc123",
    "status": "CONFIRMED",
    "vehicleId": "bus-005",
    "driverId": "driver-42",
    "estimatedArrivalTime": "2024-11-14T11:40:00.000Z",
    "fare": 50.0
  }
}
```

### 3. Monitor in Temporal UI

Open http://localhost:8080 and:
1. Click on "Workflows"
2. Find your workflow ID: `booking-user-123-1731584400000`
3. View execution history, activity results, and any errors

## Workflow Execution Flow

### Success Path

```
1. [WORKFLOW] Starting booking workflow for user-123
2. [ACTIVITY] Reserving seat...
3. [ACTIVITY] Seat reserved: res-1731584405000-xyz
4. [ACTIVITY] Processing payment...
5. [ACTIVITY] Payment successful: pay-1731584406000-abc
6. [ACTIVITY] Confirming booking...
7. [ACTIVITY] Booking confirmed: book-1731584410000-def
8. [ACTIVITY] Notifying driver driver-42...
9. [ACTIVITY] Sending notification to user-123...
10. [WORKFLOW] Booking workflow completed successfully
```

### Failure Path with Compensation

```
1. [WORKFLOW] Starting booking workflow for user-123
2. [ACTIVITY] Reserving seat...
3. [ACTIVITY] Seat reserved: res-1731584405000-xyz
4. [ACTIVITY] Processing payment...
5. [ACTIVITY] Payment successful: pay-1731584406000-abc
6. [ACTIVITY] Confirming booking...
7. [ERROR] Booking confirmation failed: Vehicle unavailable
8. [WORKFLOW] Running Saga compensation...
9. [COMPENSATION] Refunding payment pay-1731584406000-abc
10. [COMPENSATION] Refund initiated for 50.0 GHS
11. [COMPENSATION] Releasing seat res-1731584405000-xyz
12. [COMPENSATION] Seat released successfully
13. [COMPENSATION] Sending failure notification...
14. [WORKFLOW] Saga compensation completed
15. [WORKFLOW] Booking failed: Vehicle unavailable
```

## API Reference

### Create Booking

```http
POST /api/v1/booking
Content-Type: application/json

{
  "userId": "string",
  "startLocation": {
    "latitude": number,
    "longitude": number,
    "address": "string" (optional)
  },
  "endLocation": {
    "latitude": number,
    "longitude": number,
    "address": "string" (optional)
  },
  "vehicleType": "STANDARD" | "PREMIUM" | "SHUTTLE" (optional),
  "scheduledTime": "ISO8601 datetime" (optional),
  "passengerCount": number (optional)
}
```

### Get Booking Status

```http
GET /api/v1/booking/:workflowId
```

### Cancel Booking

```http
DELETE /api/v1/booking/:workflowId
```

## Monitoring & Observability

### Temporal Web UI

Access at: http://localhost:8080

Features:
- **Workflows**: List all running/completed workflows
- **Execution History**: Step-by-step workflow progress
- **Activity Details**: View activity inputs/outputs
- **Error Stack Traces**: Debug failures
- **Retry Attempts**: See retry history

### Logs

```bash
# Worker logs
cd workers/temporal-workers
pnpm dev

# NestJS logs
cd services/volteryde-nest
pnpm dev

# Follow logs in real-time
tail -f logs/application.log
```

## Production Deployment

### 1. Use Temporal Cloud (Recommended)

Sign up at: https://temporal.io/cloud

Benefits:
- Fully managed
- High availability
- Automatic scaling
- Built-in monitoring

Update `.env`:
```bash
TEMPORAL_ADDRESS=your-namespace.tmprl.cloud:7233
TEMPORAL_NAMESPACE=your-namespace
TEMPORAL_API_KEY=your-api-key
```

### 2. Self-Hosted Temporal

Deploy using our Kubernetes manifests:

```bash
# Apply Temporal Helm chart
helm repo add temporal https://temporal.io/helm-charts
helm install temporal temporal/temporal

# Deploy workers
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml
```

### 3. Environment Variables

Production `.env`:
```bash
TEMPORAL_ADDRESS=temporal.volteryde.svc.cluster.local:7233
TEMPORAL_NAMESPACE=production
TEMPORAL_TASK_QUEUE=volteryde-booking
NESTJS_API_URL=http://nestjs-service.volteryde.svc.cluster.local
SPRINGBOOT_API_URL=http://springboot-service.volteryde.svc.cluster.local
```

## Troubleshooting

### Issue: Worker won't connect to Temporal

**Symptoms**: `Connection refused` error

**Solution**:
```bash
# Check if Temporal is running
temporal server start-dev

# Or
docker-compose ps | grep temporal

# Test connection
telnet localhost 7233
```

### Issue: Workflow never completes

**Symptoms**: Status stuck at "PROCESSING"

**Solution**:
1. Check worker logs for errors
2. View workflow in Temporal UI
3. Look for activity failures or timeouts

```bash
# Increase activity timeout
startToCloseTimeout: '60 seconds'  # Was 30 seconds
```

### Issue: Payment succeeds but booking fails

**Symptoms**: Money charged, no booking

**Solution**: Saga compensation should auto-refund. Verify:
1. Check Temporal UI for compensation activities
2. Review refund logs
3. Manual refund if compensation failed:

```bash
# Query workflow for payment details
curl http://localhost:3000/api/v1/booking/:workflowId
# Use payment ID to manually refund via Paystack API
```

### Issue: Activities keep retrying

**Symptoms**: Same activity runs many times

**Solution**: Check retry policy:
```typescript
retry: {
  maximumAttempts: 3,  // Limit retries
  initialInterval: '1 second',
  maximumInterval: '10 seconds',
}
```

## Best Practices

### 1. Workflow Code Must Be Deterministic
❌ **Don't do this in workflows**:
```typescript
// NO: Random values
const id = Math.random();

// NO: Current time
const now = new Date();

// NO: Direct HTTP calls
await axios.post(...);
```

✅ **Do this instead**:
```typescript
// YES: Pass values as arguments
function workflow(id: string, timestamp: Date) { ... }

// YES: Call activities for side effects
await reserveSeat(request);
```

### 2. Use Activities for Side Effects

All external calls (HTTP, database, etc.) should be in activities, not workflows:
```typescript
// ✅ Correct
export async function processPayment(...) {
  return await axios.post('...'); // In activity
}
```

### 3. Implement Proper Logging

```typescript
// In workflows
console.log('[WORKFLOW] Step 1: Reserving seat...');

// In activities
console.log('[ACTIVITY] Processing payment for reservation ${id}');
```

### 4. Handle Errors Gracefully

```typescript
try {
  const payment = await processPayment(reservation);
  if (payment.status !== 'SUCCESS') {
    throw new Error(`Payment failed: ${payment.failureReason}`);
  }
} catch (error) {
  // Run compensation
  await compensate();
  throw error; // Re-throw to fail workflow
}
```

## Next Steps

1. **Add More Workflows**
   - Fleet assignment workflow
   - Charging session workflow
   - Driver shift workflow

2. **Implement Signals**
   - Update passenger location mid-ride
   - Driver accepts/rejects booking
   - Cancel booking in progress

3. **Add Queries**
   - Get real-time booking status
   - Query ETA updates
   - Check payment status

4. **Integrate with Mobile Apps**
   - Mobile Passenger App subscribes to workflow events
   - Driver App receives notifications via Temporal signals

5. **Enhance Observability**
   - Custom metrics in Prometheus
   - Grafana dashboards for workflow success rates
   - Alert on failed workflows

## Resources

- **Temporal Documentation**: https://docs.temporal.io/
- **TypeScript SDK**: https://docs.temporal.io/dev-guide/typescript
- **Saga Pattern**: https://docs.temporal.io/dev-guide/typescript/features#saga-pattern
- **Volteryde Technical Blueprint**: `./TECHNICAL_BLUEPRINT.md`
- **Temporal Implementation Guide**: `./Volteryde Application Requirements/TEMPORAL_IMPLEMENTATION_GUIDE.md`

---

**Implementation Status**: ✅ Complete and Production-Ready

**Last Updated**: November 14, 2024
