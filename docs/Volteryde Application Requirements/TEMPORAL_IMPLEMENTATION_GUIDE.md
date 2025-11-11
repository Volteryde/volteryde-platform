# Temporal Workflow Implementation Guide
## Durable Workflow Orchestration for Mission-Critical Processes

---

## Overview

This guide covers deploying and using **Temporal** for orchestrating complex, long-running business workflows in Volteryde. Temporal provides:

- ✅ **Durable execution** - Workflows survive crashes and restarts
- ✅ **Automatic retries** - Configurable retry policies with exponential backoff
- ✅ **Compensation logic** - Automatic rollback on failures (Saga pattern)
- ✅ **Human-in-the-loop** - Wait for manual approvals or external events
- ✅ **Visibility** - Full audit trail and monitoring

---

## Temporal Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Temporal Cluster                    │
│  ┌───────────────┐  ┌──────────────┐               │
│  │ Temporal      │  │ PostgreSQL   │               │
│  │ Server        │→ │ (Persistence)│               │
│  └───────────────┘  └──────────────┘               │
│         ↑                                           │
└─────────┼───────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────┐
│              Temporal Workers (Kubernetes)          │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ Booking      │  │ Payment      │                │
│  │ Worker       │  │ Worker       │  ...           │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│           Application Services (NestJS/Java)        │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ Booking API  │  │ Payment API  │                │
│  │ (starts wf)  │  │ (starts wf)  │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

---

## Deploying Temporal to Kubernetes (Helm)

### 1. Add Temporal Helm Repository

```bash
helm repo add temporal https://go.temporal.io/helm-charts
helm repo update
```

### 2. Create Namespace

```bash
kubectl create namespace temporal-system
```

### 3. Install Temporal with PostgreSQL Backend

**`infrastructure/kubernetes/temporal/values-dev.yaml`**:
```yaml
server:
  replicaCount: 1
  
  config:
    persistence:
      default:
        driver: "sql"
        sql:
          driver: "postgres"
          host: "volteryde-dev-postgres.rds.amazonaws.com"
          port: 5432
          database: "temporal"
          user: "temporal_user"
          password: "CHANGE_ME" # Use secret in production
          maxConns: 20
          maxIdleConns: 20
      visibility:
        driver: "sql"
        sql:
          driver: "postgres"
          host: "volteryde-dev-postgres.rds.amazonaws.com"
          port: 5432
          database: "temporal_visibility"
          user: "temporal_user"
          password: "CHANGE_ME"
          maxConns: 10
          maxIdleConns: 10

  frontend:
    service:
      type: ClusterIP
      port: 7233

  metrics:
    prometheus:
      enabled: true
      timerType: "histogram"

web:
  enabled: true
  replicaCount: 1
  service:
    type: LoadBalancer
    port: 8080
  ingress:
    enabled: true
    hosts:
      - temporal-dev.volteryde.com

elasticsearch:
  enabled: false # Use PostgreSQL for visibility instead

prometheus:
  enabled: true

grafana:
  enabled: true
```

### 4. Install Temporal

```bash
helm install temporal temporal/temporal \
  -f infrastructure/kubernetes/temporal/values-dev.yaml \
  -n temporal-system
```

### 5. Verify Installation

```bash
kubectl get pods -n temporal-system
kubectl get svc -n temporal-system

# Access Temporal Web UI
kubectl port-forward svc/temporal-web 8080:8080 -n temporal-system
# Open http://localhost:8080
```

---

## Temporal Worker Service (TypeScript)

### Project Structure

```
services/temporal-workers/
├── src/
│   ├── activities/
│   │   ├── booking-activities.ts
│   │   ├── payment-activities.ts
│   │   └── fleet-activities.ts
│   ├── workflows/
│   │   ├── booking-workflow.ts
│   │   ├── payment-workflow.ts
│   │   └── fleet-workflow.ts
│   ├── workers/
│   │   ├── booking-worker.ts
│   │   ├── payment-worker.ts
│   │   └── fleet-worker.ts
│   └── main.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Install Dependencies

**`package.json`**:
```json
{
  "name": "@volteryde/temporal-workers",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/main.js",
    "dev": "ts-node src/main.ts"
  },
  "dependencies": {
    "@temporalio/worker": "^1.8.0",
    "@temporalio/client": "^1.8.0",
    "@temporalio/activity": "^1.8.0",
    "@temporalio/workflow": "^1.8.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

---

## Example 1: Booking Workflow

### Activities (Service Calls)

**`src/activities/booking-activities.ts`**:
```typescript
import { Context } from '@temporalio/activity';
import axios from 'axios';

export interface ReserveSeatInput {
  busId: string;
  segment: string;
  userId: string;
}

export interface ReserveSeatOutput {
  reservationId: string;
  seatNumber: string;
  expiresAt: Date;
}

// Activity: Reserve seat in booking service
export async function reserveSeat(input: ReserveSeatInput): Promise<ReserveSeatOutput> {
  const context = Context.current();
  
  context.log.info('Reserving seat', { busId: input.busId, userId: input.userId });
  
  const response = await axios.post('http://booking-service/api/v1/seats/reserve', {
    busId: input.busId,
    segment: input.segment,
    userId: input.userId,
  }, {
    timeout: 5000,
    headers: {
      'X-Activity-ID': context.info.activityId,
    },
  });
  
  return response.data;
}

// Activity: Release seat (compensation)
export async function releaseSeat(reservationId: string): Promise<void> {
  const context = Context.current();
  
  context.log.info('Releasing seat', { reservationId });
  
  await axios.post('http://booking-service/api/v1/seats/release', {
    reservationId,
  });
}

// Activity: Process payment
export async function processPayment(input: {
  userId: string;
  amount: number;
  reservationId: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const context = Context.current();
  
  context.log.info('Processing payment', { amount: input.amount, userId: input.userId });
  
  try {
    const response = await axios.post('http://payment-service/api/v1/payments/charge', {
      userId: input.userId,
      amount: input.amount,
      metadata: {
        reservationId: input.reservationId,
      },
    }, {
      timeout: 30000, // 30 second timeout
    });
    
    return {
      success: true,
      transactionId: response.data.transactionId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Activity: Confirm booking
export async function confirmBooking(input: {
  reservationId: string;
  paymentId: string;
}): Promise<{ bookingId: string }> {
  const context = Context.current();
  
  context.log.info('Confirming booking', { reservationId: input.reservationId });
  
  const response = await axios.post('http://booking-service/api/v1/bookings/confirm', {
    reservationId: input.reservationId,
    paymentId: input.paymentId,
  });
  
  return response.data;
}

// Activity: Send notification
export async function sendBookingConfirmation(input: {
  userId: string;
  bookingId: string;
}): Promise<void> {
  const context = Context.current();
  
  context.log.info('Sending booking confirmation', { bookingId: input.bookingId });
  
  await axios.post('http://notification-service/api/v1/notifications/send', {
    userId: input.userId,
    type: 'BOOKING_CONFIRMED',
    data: {
      bookingId: input.bookingId,
    },
  });
}

// Activity: Assign to driver manifest
export async function assignToManifest(input: {
  busId: string;
  bookingId: string;
}): Promise<void> {
  const context = Context.current();
  
  context.log.info('Assigning to driver manifest', { busId: input.busId, bookingId: input.bookingId });
  
  await axios.post('http://fleet-service/api/v1/manifests/add-booking', {
    busId: input.busId,
    bookingId: input.bookingId,
  });
}
```

### Workflow Definition

**`src/workflows/booking-workflow.ts`**:
```typescript
import {
  proxyActivities,
  sleep,
  defineSignal,
  setHandler,
  condition,
} from '@temporalio/workflow';
import type * as activities from '../activities/booking-activities';

// Configure activity retry policy
const { 
  reserveSeat, 
  releaseSeat, 
  processPayment, 
  confirmBooking,
  sendBookingConfirmation,
  assignToManifest,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    maximumInterval: '30s',
    backoffCoefficient: 2,
    maximumAttempts: 5,
  },
});

export interface BookingRequest {
  userId: string;
  busId: string;
  segment: string;
  fare: number;
}

export interface BookingResult {
  bookingId: string;
  status: 'CONFIRMED' | 'FAILED';
  error?: string;
}

// Define signal for cancellation
export const cancelBookingSignal = defineSignal<[string]>('cancelBooking');

export async function bookRideWorkflow(request: BookingRequest): Promise<BookingResult> {
  let reservationId: string | null = null;
  let isCancelled = false;

  // Set up cancellation signal handler
  setHandler(cancelBookingSignal, (reason: string) => {
    isCancelled = true;
    console.log('Booking cancellation requested:', reason);
  });

  try {
    // Step 1: Reserve seat (with automatic retry)
    const reservation = await reserveSeat({
      busId: request.busId,
      segment: request.segment,
      userId: request.userId,
    });
    
    reservationId = reservation.reservationId;
    console.log('Seat reserved:', reservationId);

    // Check if cancelled before payment
    if (isCancelled) {
      await releaseSeat(reservationId);
      return {
        bookingId: '',
        status: 'FAILED',
        error: 'Booking cancelled by user',
      };
    }

    // Step 2: Process payment (with timeout)
    const paymentResult = await processPayment({
      userId: request.userId,
      amount: request.fare,
      reservationId,
    });

    if (!paymentResult.success) {
      // Compensation: Release seat if payment fails
      console.log('Payment failed, releasing seat');
      await releaseSeat(reservationId);
      
      return {
        bookingId: '',
        status: 'FAILED',
        error: paymentResult.error || 'Payment failed',
      };
    }

    console.log('Payment successful:', paymentResult.transactionId);

    // Step 3: Confirm booking
    const booking = await confirmBooking({
      reservationId,
      paymentId: paymentResult.transactionId!,
    });

    console.log('Booking confirmed:', booking.bookingId);

    // Step 4: Send notification (async, doesn't block workflow completion)
    // Use fire-and-forget pattern
    sendBookingConfirmation({
      userId: request.userId,
      bookingId: booking.bookingId,
    }).catch(err => {
      // Log error but don't fail workflow
      console.error('Failed to send notification:', err);
    });

    // Step 5: Assign to driver manifest
    await assignToManifest({
      busId: request.busId,
      bookingId: booking.bookingId,
    });

    return {
      bookingId: booking.bookingId,
      status: 'CONFIRMED',
    };

  } catch (error: any) {
    // Final compensation: release seat if any step fails
    if (reservationId) {
      console.log('Workflow failed, releasing seat');
      await releaseSeat(reservationId).catch(err => {
        console.error('Failed to release seat:', err);
      });
    }

    return {
      bookingId: '',
      status: 'FAILED',
      error: error.message,
    };
  }
}
```

---

## Example 2: Payment Workflow with Human-in-the-Loop

**`src/workflows/payment-workflow.ts`**:
```typescript
import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  sleep,
} from '@temporalio/workflow';
import type * as activities from '../activities/payment-activities';

const {
  initiatePaystackPayment,
  cancelPaystackPayment,
  creditWallet,
  generateInvoice,
  sendReceiptEmail,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '2 minutes',
  retry: {
    initialInterval: '2s',
    maximumInterval: '60s',
    backoffCoefficient: 2,
    maximumAttempts: 3,
  },
});

// Signals
export const paystackWebhookSignal = defineSignal<[PaymentWebhookEvent]>('paystackWebhookReceived');

export interface WalletTopUpRequest {
  userId: string;
  amount: number;
}

export interface PaymentWebhookEvent {
  success: boolean;
  amount: number;
  transactionId: string;
}

export async function walletTopUpWorkflow(request: WalletTopUpRequest): Promise<any> {
  let paymentIntentId: string | null = null;
  let webhookReceived = false;
  let webhookData: PaymentWebhookEvent | null = null;

  // Set up webhook signal handler
  setHandler(paystackWebhookSignal, (event: PaymentWebhookEvent) => {
    webhookReceived = true;
    webhookData = event;
    console.log('Paystack webhook received:', event);
  });

  try {
    // Step 1: Initiate Paystack payment
    const paymentIntent = await initiatePaystackPayment({
      userId: request.userId,
      amount: request.amount,
    });

    paymentIntentId = paymentIntent.id;
    console.log('Payment intent created:', paymentIntentId);

    // Step 2: Wait for Paystack webhook confirmation (max 10 minutes)
    const webhookReceived = await condition(() => webhookReceived, '10m');

    if (!webhookReceived || !webhookData) {
      // Timeout: Cancel payment and fail workflow
      console.log('Payment confirmation timeout, cancelling');
      await cancelPaystackPayment(paymentIntentId);
      throw new Error('Payment confirmation timeout');
    }

    if (!webhookData.success) {
      // Payment failed
      console.log('Payment failed');
      throw new Error('Payment failed');
    }

    // Step 3: Credit wallet (guaranteed exactly-once)
    await creditWallet({
      userId: request.userId,
      amount: webhookData.amount,
      transactionId: webhookData.transactionId,
    });

    console.log('Wallet credited:', webhookData.amount);

    // Step 4: Generate invoice (async)
    await generateInvoice({
      userId: request.userId,
      transactionId: webhookData.transactionId,
    });

    // Step 5: Send receipt email
    await sendReceiptEmail({
      userId: request.userId,
      transactionId: webhookData.transactionId,
    });

    return {
      success: true,
      transactionId: webhookData.transactionId,
    };

  } catch (error: any) {
    // Compensation: Cancel payment if not completed
    if (paymentIntentId && !webhookData?.success) {
      await cancelPaystackPayment(paymentIntentId).catch(err => {
        console.error('Failed to cancel payment:', err);
      });
    }

    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## Temporal Worker

**`src/workers/booking-worker.ts`**:
```typescript
import { NativeConnection, Worker } from '@temporalio/worker';
import * as activities from '../activities/booking-activities';
import { bookRideWorkflow } from '../workflows/booking-workflow';

async function run() {
  // Connect to Temporal server
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS || 'temporal-frontend.temporal-system.svc.cluster.local:7233',
  });

  // Create worker
  const worker = await Worker.create({
    connection,
    namespace: 'volteryde-dev',
    taskQueue: 'booking-tasks',
    workflowsPath: require.resolve('../workflows/booking-workflow'),
    activities,
    maxConcurrentActivityTaskExecutions: 10,
    maxConcurrentWorkflowTaskExecutions: 10,
  });

  console.log('Booking worker started, listening on task queue: booking-tasks');
  
  // Start worker
  await worker.run();
}

run().catch((err) => {
  console.error('Worker error:', err);
  process.exit(1);
});
```

---

## Starting Workflows from Application Code

### NestJS Service

**`services/booking-domain/src/temporal/temporal.service.ts`**:
```typescript
import { Injectable } from '@nestjs/common';
import { Client, Connection } from '@temporalio/client';
import { bookRideWorkflow, BookingRequest } from '@volteryde/temporal-workers/workflows/booking-workflow';

@Injectable()
export class TemporalService {
  private client: Client;

  async onModuleInit() {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS || 'temporal-frontend.temporal-system.svc.cluster.local:7233',
    });

    this.client = new Client({
      connection,
      namespace: 'volteryde-dev',
    });
  }

  async startBookingWorkflow(request: BookingRequest): Promise<string> {
    const workflowId = `booking-${request.userId}-${Date.now()}`;

    const handle = await this.client.workflow.start(bookRideWorkflow, {
      taskQueue: 'booking-tasks',
      workflowId,
      args: [request],
      // Workflow execution timeout (max time workflow can run)
      workflowExecutionTimeout: '30m',
    });

    console.log(`Started workflow ${workflowId}`);

    return handle.workflowId;
  }

  async getBookingWorkflowResult(workflowId: string): Promise<any> {
    const handle = this.client.workflow.getHandle(workflowId);
    return await handle.result();
  }

  async cancelBookingWorkflow(workflowId: string, reason: string): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal('cancelBooking', reason);
  }
}
```

### API Controller

**`services/booking-domain/src/bookings/bookings.controller.ts`**:
```typescript
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TemporalService } from '../temporal/temporal.service';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private temporalService: TemporalService) {}

  @Post()
  async createBooking(@Body() request: any) {
    const workflowId = await this.temporalService.startBookingWorkflow({
      userId: request.userId,
      busId: request.busId,
      segment: request.segment,
      fare: request.fare,
    });

    return {
      workflowId,
      message: 'Booking workflow started',
    };
  }

  @Get(':workflowId/status')
  async getBookingStatus(@Param('workflowId') workflowId: string) {
    const result = await this.temporalService.getBookingWorkflowResult(workflowId);
    return result;
  }

  @Post(':workflowId/cancel')
  async cancelBooking(@Param('workflowId') workflowId: string) {
    await this.temporalService.cancelBookingWorkflow(workflowId, 'User requested cancellation');
    return { message: 'Booking cancelled' };
  }
}
```

---

## Monitoring Temporal

### Prometheus Metrics

Temporal exports metrics to Prometheus automatically. Add scrape config:

**`infrastructure/kubernetes/prometheus/temporal-scrape-config.yaml`**:
```yaml
- job_name: 'temporal'
  kubernetes_sd_configs:
  - role: pod
    namespaces:
      names:
      - temporal-system
  relabel_configs:
  - source_labels: [__meta_kubernetes_pod_label_app]
    regex: temporal-frontend
    action: keep
  - source_labels: [__meta_kubernetes_pod_container_port_number]
    regex: "9090"
    action: keep
```

### Grafana Dashboard

Import Temporal's official Grafana dashboard:
- Dashboard ID: **13084** (Temporal Server Metrics)
- Dashboard ID: **13085** (Temporal SDK Metrics)

---

## Summary

✅ Temporal cluster deployed on Kubernetes  
✅ Durable booking workflow with compensation  
✅ Payment workflow with webhook handling  
✅ Human-in-the-loop approval patterns  
✅ Automatic retries and timeouts  
✅ Workflow monitoring with Prometheus/Grafana  
✅ Integration with NestJS services

**Next**: See `CICD_PIPELINE_GUIDE.md` for automated deployments
