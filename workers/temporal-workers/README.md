# Temporal Workers for Volteryde Platform

This package contains the Temporal workflow workers that execute durable, fault-tolerant business logic for the Volteryde platform.

## What Are Temporal Workers?

Temporal workers are processes that poll the Temporal server for tasks (workflows and activities) and execute them. They are:

- **Durable**: Workflows resume from checkpoints after crashes
- **Fault-tolerant**: Automatic retries with exponential backoff
- **Observable**: Full execution history visible in Temporal UI
- **Scalable**: Add more workers to handle increased load

## Structure

```
src/
├── interfaces.ts              # Shared type definitions
├── activities/
│   └── booking.activities.ts  # Activity implementations
├── workflows/
│   └── booking.workflow.ts    # Workflow orchestration
├── workers/
│   └── booking.worker.ts      # Worker setup and configuration
└── index.ts                   # Entry point
```

## Quick Start

### 1. Start Temporal Server

```bash
# Option 1: Using Temporal CLI
temporal server start-dev

# Option 2: Using Docker Compose (from project root)
docker-compose up temporal temporal-ui
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Environment Variables

Create `.env` file (copy from project root `.env.example`):

```bash
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=volteryde-booking

NESTJS_API_URL=http://localhost:3000
SPRINGBOOT_API_URL=http://localhost:8080
```

### 4. Run the Worker

```bash
# Development mode with auto-reload
pnpm dev

# Production build
pnpm build
pnpm start
```

You should see:

```
======================================================================
Volteryde Temporal Worker - Starting...
======================================================================
Temporal Server: localhost:7233
Task Queue: volteryde-booking
Namespace: default

✓ Connected to Temporal server
✓ Worker created successfully

======================================================================
Worker is ready and polling for tasks...
Press Ctrl+C to stop
======================================================================
```

## Available Scripts

```bash
pnpm dev        # Start worker in development mode
pnpm build      # Compile TypeScript to JavaScript
pnpm start      # Run compiled worker
pnpm lint       # Run ESLint
pnpm test       # Run tests with Jest
pnpm typecheck  # Type-check without building
```

## Workflows

### `bookRideWorkflow`

Orchestrates the complete booking process:

1. **Reserve Seat** - Creates temporary reservation
2. **Process Payment** - Charges via Paystack
3. **Confirm Booking** - Finalizes booking and assigns driver
4. **Notify** - Alerts driver and passenger

**Saga Compensation**: If any step fails after payment, the workflow automatically:
- Refunds the payment
- Releases the seat reservation
- Notifies the user

**Example**:

```typescript
import { Client } from '@temporalio/client';

const client = new Client();

const handle = await client.workflow.start('bookRideWorkflow', {
  args: [{
    userId: 'user-123',
    startLocation: { latitude: 5.6037, longitude: -0.187 },
    endLocation: { latitude: 5.6137, longitude: -0.207 },
  }],
  taskQueue: 'volteryde-booking',
  workflowId: 'booking-user-123-' + Date.now(),
});

const result = await handle.result();
console.log('Booking confirmed:', result.bookingId);
```

## Activities

Activities are the "workhorses" that perform actual operations:

### `reserveSeat(request)`
Creates a temporary seat reservation in the booking system.

### `processPayment(reservation)`
Processes payment through Paystack API.

### `confirmBooking(reservation, payment)`
Finalizes the booking and assigns a driver.

### `notifyDriver(notification)`
Sends notification to the assigned driver.

### `sendNotification(notification)`
Sends SMS/email/push notification to passenger.

### Compensation Activities

### `releaseSeatReservation(reservation)`
Releases a seat reservation (compensation).

### `refundPayment(payment)`
Initiates a payment refund (compensation).

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:cov
```

Tests use Temporal's testing framework to mock activities and verify workflow behavior.

## Monitoring

### Temporal Web UI

Access at: http://localhost:8080

- View all workflows
- Inspect execution history
- Debug failures
- Monitor activity retries

### Logs

Worker logs all operations:

```
[WORKFLOW] Starting booking workflow for user-123
[ACTIVITY] Reserving seat...
[ACTIVITY] Seat reserved: res-123
[ACTIVITY] Processing payment...
[ACTIVITY] Payment successful: pay-456
[ACTIVITY] Confirming booking...
[ACTIVITY] Booking confirmed: book-789
[WORKFLOW] Booking workflow completed successfully
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --prod

# Copy source
COPY . .

# Build
RUN pnpm build

# Run worker
CMD ["node", "dist/index.js"]
```

### Kubernetes

Deploy using the manifest in `infrastructure/kubernetes/base/temporal-workers-deployment.yaml`:

```bash
kubectl apply -f infrastructure/kubernetes/base/temporal-workers-deployment.yaml
```

### Environment Variables

Set these in your deployment:

```yaml
env:
  - name: TEMPORAL_ADDRESS
    value: "temporal.volteryde.svc.cluster.local:7233"
  - name: TEMPORAL_NAMESPACE
    value: "production"
  - name: TEMPORAL_TASK_QUEUE
    value: "volteryde-booking"
  - name: NESTJS_API_URL
    value: "http://nestjs-service:80"
  - name: SPRINGBOOT_API_URL
    value: "http://springboot-service:80"
```

## Scaling

Workers can be scaled horizontally:

```bash
# Kubernetes
kubectl scale deployment temporal-workers --replicas=5

# Docker Compose
docker-compose up --scale temporal-workers=5
```

Temporal automatically distributes tasks across all workers.

## Troubleshooting

### Worker won't connect

```
❌ Could not connect to Temporal server
```

**Solution**: Ensure Temporal is running:

```bash
temporal server start-dev
# or
docker-compose up temporal
```

### Activities timing out

```
Activity startToCloseTimeout exceeded
```

**Solution**: Increase timeout in workflow:

```typescript
const activities = proxyActivities({
  startToCloseTimeout: '60 seconds', // Increase from 30
});
```

### Workflow stuck

**Solution**: Check Temporal UI for errors and activity status. Restart worker if needed:

```bash
pnpm dev
```

## Resources

- [Full Implementation Guide](../../docs/TEMPORAL_BOOKING_WORKFLOW_GUIDE.md)
- [Temporal TypeScript SDK](https://docs.temporal.io/dev-guide/typescript)
- [Workflow Patterns](https://docs.temporal.io/dev-guide/typescript/features)
- [Best Practices](https://docs.temporal.io/dev-guide/typescript/best-practices)

---

**Questions?** Check the [main documentation](../../docs/TEMPORAL_BOOKING_WORKFLOW_GUIDE.md) or [Temporal docs](https://docs.temporal.io/).
