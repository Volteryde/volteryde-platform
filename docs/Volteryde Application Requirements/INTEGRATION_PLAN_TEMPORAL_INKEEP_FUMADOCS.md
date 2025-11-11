# 🚀 Volteryde Platform Enhancement: Integration Plan
## Temporal, Inkeep & Fumadocs Implementation Strategy

**Date**: November 11, 2025  
**Status**: Planning Phase  
**Priority**: Critical for Production Readiness

---

## 📋 Executive Summary

This document outlines the integration strategy for three **free, production-ready tools** that will dramatically enhance Volteryde's reliability, user support, and developer experience:

1. **Temporal** - Workflow orchestration for mission-critical business processes
2. **Inkeep** - AI-powered documentation and support assistant
3. **Fumadocs** - Modern documentation framework

---

## 🔍 Current State Analysis

### What We Currently Have

#### ✅ **Backend Architecture**
- **Java (Spring Boot)**: Authentication, Authorization (OAuth2, JWT, RBAC), Payment Processing (Paystack)
- **NestJS (TypeScript)**: Core business services, real-time features, WebSocket support

#### ✅ **Domain-Driven Design Architecture**
1. **Vehicle & Telematics Domain** (NestJS)
   - GPS Location Service, Battery Service, Diagnostics Service, Telemetry Aggregator
   - Database: InfluxDB/TimescaleDB (time-series) + Redis (current state)

2. **Fleet Operations Domain** (NestJS)
   - Vehicle Management, Maintenance Service, Fleet Analytics, Fleet Reporting
   - Database: PostgreSQL + Redis

3. **Charging Infrastructure Domain** (NestJS)
   - Charging Station Service, Reservation Service, Charging Session Service
   - Database: PostgreSQL + Redis

4. **Booking & Dispatch Domain** (NestJS)
   - Bus Discovery, Seat Map, Seat Booking, Boarding/Drop-off Detection, Active Booking Tracking
   - Database: PostgreSQL + PostGIS + Redis

5. **Payment Domain** (Java)
   - Payment Processing (Paystack), Wallet Service, Fare Calculation, Invoice Generation, Refund Service
   - Database: PostgreSQL + Redis

6. **Authentication & User Management Domain** (Java)
   - User Authentication, OAuth2, RBAC, MFA, Session Management, Profile Services
   - Database: PostgreSQL + Redis

#### ✅ **Shared Services**
- **Notifications**: SMS (Twilio), Email (SendGrid), Push (FCM/APNs), WebSocket (Socket.io)
- **Customer Support**: Ticketing System, Live Chat, FAQ Management
- **Analytics**: Booking Analytics, Financial Analytics, Driver Performance, Real-time Dashboards
- **Geolocation**: Geocoding, Distance Calculation, Route Planning, Geofencing
- **Scheduling**: Background Jobs, Cron Tasks

#### ✅ **Event-Driven Architecture**
- Event Bus: Kafka/RabbitMQ
- Published Events: vehicle-location, battery-updated, diagnostics-warning, maintenance-scheduled, reservation-confirmed, session-completed

### ⚠️ **Critical Gaps Identified**

1. **No Workflow Orchestration**
   - Complex booking flows are fragile and can lose state during failures
   - Payment processes lack automatic retry and compensation logic
   - Fleet operations (maintenance, charging) have no durable execution guarantees
   - Human-in-the-loop processes (driver onboarding, inspections) are ad-hoc

2. **No Intelligent User Support**
   - Customer support relies on human agents (expensive, slow to scale)
   - No self-service AI assistant for riders or drivers
   - Documentation gaps are not automatically identified
   - Support knowledge is siloed, not searchable

3. **No Professional Documentation Framework**
   - Current setup has basic README only
   - No API documentation for third-party integrations
   - No internal technical documentation for team onboarding
   - No public knowledge base for users

---

## 🎯 Integration Strategy

---

## 1️⃣ TEMPORAL - Workflow Orchestration Engine

### 🔧 What Temporal Solves for Volteryde

Temporal provides **durable execution** for complex, long-running business processes with:
- ✅ Automatic retries with exponential backoff
- ✅ State persistence across crashes and deployments
- ✅ Built-in timeout and cancellation handling
- ✅ Human-in-the-loop workflow support
- ✅ Saga pattern for distributed transactions
- ✅ Visibility and monitoring of workflow execution

### 📊 Temporal Use Cases in Volteryde Architecture

#### **Priority 1 - Booking Workflows (Critical)**

**Current Problem**: Booking flow is fragile and can break if any step fails
```
Current Flow (Fragile):
User clicks "Book" 
  → Create booking record
  → Check seat availability
  → Lock seat
  → Process payment
  → Confirm booking
  → Notify user
  → Assign driver
  
❌ If payment fails after seat lock → seat remains locked
❌ If system crashes mid-process → booking state is unknown
❌ If notification fails → user doesn't know booking status
```

**Temporal Solution**: Durable Booking Workflow
```typescript
// Temporal Workflow: booking-workflow.ts
@WorkflowMethod
async function bookRideWorkflow(bookingRequest: BookingRequest): Promise<BookingResult> {
  // Step 1: Reserve seat (with automatic retry)
  const seatReservation = await activities.reserveSeat({
    busId: bookingRequest.busId,
    segment: bookingRequest.segment,
    userId: bookingRequest.userId
  });
  
  // Step 2: Process payment (with timeout and retry)
  const paymentResult = await activities.processPayment({
    userId: bookingRequest.userId,
    amount: bookingRequest.fare,
    reservationId: seatReservation.id
  });
  
  if (!paymentResult.success) {
    // Compensation: Release seat if payment fails
    await activities.releaseSeat(seatReservation.id);
    throw new PaymentFailedError();
  }
  
  // Step 3: Confirm booking (with retry)
  const booking = await activities.confirmBooking({
    reservationId: seatReservation.id,
    paymentId: paymentResult.transactionId
  });
  
  // Step 4: Send notifications (async, doesn't block workflow)
  await activities.sendBookingConfirmation({
    userId: bookingRequest.userId,
    bookingId: booking.id
  });
  
  // Step 5: Assign to driver manifest
  await activities.assignToManifest({
    busId: bookingRequest.busId,
    bookingId: booking.id
  });
  
  return {
    bookingId: booking.id,
    status: 'CONFIRMED'
  };
}
```

**Benefits**:
- ✅ Automatic rollback if payment fails (seat is released)
- ✅ Workflow resumes from last checkpoint if system crashes
- ✅ Built-in retries for transient failures (network issues, API timeouts)
- ✅ Full audit trail of every step
- ✅ Can handle workflows that take minutes or hours

---

#### **Priority 2 - Payment Processing Workflows**

**Current Problem**: Multi-step payment flows can fail silently

**Temporal Workflows**:
1. **Wallet Top-Up Workflow**
   ```
   Initiate payment → Verify with Paystack → Update wallet balance → Send receipt → Log transaction
   ```
   - Auto-retry if Paystack API is down
   - Guarantee exactly-once wallet credit (no duplicate credits)

2. **Refund Workflow**
   ```
   Validate refund request → Check eligibility → Process Paystack refund → Update wallet → Notify user → Update booking status
   ```
   - Human-in-the-loop: If refund > $100, require manual approval
   - Automatic compensation if Paystack refund fails

3. **Distance-Based Fare Calculation Workflow**
   ```
   Track ride segments → Calculate base fare → Apply surge pricing → Apply discounts → Deduct from wallet → Generate invoice
   ```
   - Durable tracking across long rides (multiple hours)
   - No fare calculation lost even during deployment

---

#### **Priority 3 - Fleet Operations Workflows**

**Temporal Workflows for Fleet Operations Domain**:

1. **Maintenance Scheduling Workflow**
   ```typescript
   @WorkflowMethod
   async function maintenanceWorkflow(vehicleId: string) {
     // Step 1: Monitor telemetry for maintenance triggers
     const diagnosticData = await workflow.condition(
       () => needsMaintenance(vehicleId),
       Duration.ofDays(30) // Check for 30 days
     );
     
     // Step 2: Create maintenance ticket
     const ticket = await activities.createMaintenanceTicket(vehicleId);
     
     // Step 3: Assign to maintenance facility
     const assignment = await activities.assignToFacility(ticket.id);
     
     // Step 4: Wait for human approval (human-in-the-loop)
     const approval = await workflow.waitForSignal<MaintenanceApproval>(
       'maintenanceApproved',
       Duration.ofDays(7)
     );
     
     // Step 5: Schedule maintenance window
     await activities.scheduleMaintenanceWindow({
       vehicleId,
       facility: assignment.facilityId,
       date: approval.scheduledDate
     });
     
     // Step 6: Wait for maintenance completion
     await workflow.waitForSignal('maintenanceCompleted');
     
     // Step 7: Update vehicle status
     await activities.updateVehicleStatus(vehicleId, 'ACTIVE');
   }
   ```

2. **Charging Cycle Workflow**
   ```
   Vehicle battery drops below 20% → Find available charging station → Reserve slot → Navigate vehicle → Start charging session → Monitor charging → Complete session → Update battery metrics → Return to fleet
   ```
   - Can run for 4-8 hours (full charging cycle)
   - Survives system restarts and deployments

3. **Vehicle Assignment Workflow**
   ```
   Receive route schedule → Check vehicle availability → Validate battery level → Check maintenance status → Assign driver → Update manifest → Notify driver → Track compliance
   ```

---

#### **Priority 4 - Human-in-the-Loop Workflows**

1. **Driver Onboarding Workflow**
   ```typescript
   @WorkflowMethod
   async function driverOnboardingWorkflow(driverId: string) {
     // Step 1: Submit documents
     await activities.uploadDocuments(driverId);
     
     // Step 2: Background check (external API, takes 2-5 days)
     const backgroundCheck = await activities.initiateBackgroundCheck(driverId);
     
     // Step 3: Wait for background check result (human-in-the-loop)
     const bgResult = await workflow.waitForSignal<BackgroundCheckResult>(
       'backgroundCheckCompleted',
       Duration.ofDays(7)
     );
     
     if (!bgResult.passed) {
       await activities.rejectDriver(driverId, bgResult.reason);
       return { status: 'REJECTED' };
     }
     
     // Step 4: Schedule in-person interview
     const interview = await activities.scheduleInterview(driverId);
     
     // Step 5: Wait for interview completion
     await workflow.waitForSignal('interviewCompleted', Duration.ofDays(14));
     
     // Step 6: Manual approval from HR
     const hrApproval = await workflow.waitForSignal<HRApproval>(
       'hrApproved',
       Duration.ofDays(3)
     );
     
     // Step 7: Activate driver account
     await activities.activateDriver(driverId);
     
     // Step 8: Send welcome email and credentials
     await activities.sendWelcomePackage(driverId);
     
     return { status: 'ACTIVE' };
   }
   ```

2. **Vehicle Inspection Workflow**
   ```
   Schedule inspection → Send notification → Wait for inspection completion → Upload photos → Manual review → Approve/Reject → Update vehicle status
   ```

3. **Customer Support Escalation Workflow**
   ```
   Create ticket → Auto-assign to agent → Wait 24 hours → If unresolved, escalate to supervisor → Wait 48 hours → If unresolved, escalate to manager → Resolve → Send satisfaction survey
   ```

---

### 🛠️ Temporal Implementation Plan

#### **Phase 1: Setup & Infrastructure (Week 1-2)**

1. **Deploy Temporal Server**
   ```yaml
   # docker-compose.temporal.yml
   version: '3.8'
   services:
     temporal:
       image: temporalio/auto-setup:latest
       environment:
         - DB=postgresql
         - DB_PORT=5432
         - POSTGRES_USER=temporal
         - POSTGRES_PWD=temporal
         - POSTGRES_SEEDS=postgres
       ports:
         - "7233:7233"
       depends_on:
         - postgres
     
     temporal-admin-tools:
       image: temporalio/admin-tools:latest
       depends_on:
         - temporal
     
     temporal-ui:
       image: temporalio/ui:latest
       ports:
         - "8088:8088"
       environment:
         - TEMPORAL_ADDRESS=temporal:7233
   ```

2. **Install Temporal SDKs**
   ```bash
   # NestJS services
   pnpm add @temporalio/client @temporalio/worker @temporalio/workflow @temporalio/activity
   
   # Java services
   # Add to pom.xml
   <dependency>
     <groupId>io.temporal</groupId>
     <artifactId>temporal-sdk</artifactId>
     <version>1.20.0</version>
   </dependency>
   ```

3. **Create Temporal Module for NestJS**
   ```typescript
   // libs/temporal/src/temporal.module.ts
   import { Module } from '@nestjs/common';
   import { Connection, Client } from '@temporalio/client';
   
   @Module({
     providers: [
       {
         provide: 'TEMPORAL_CONNECTION',
         useFactory: async () => {
           return await Connection.connect({
             address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
           });
         },
       },
       {
         provide: 'TEMPORAL_CLIENT',
         useFactory: async (connection: Connection) => {
           return new Client({ connection });
         },
         inject: ['TEMPORAL_CONNECTION'],
       },
     ],
     exports: ['TEMPORAL_CLIENT'],
   })
   export class TemporalModule {}
   ```

#### **Phase 2: Migrate Critical Workflows (Week 3-4)**

**Priority Order**:
1. ✅ Booking Workflow (highest risk if it fails)
2. ✅ Payment Processing Workflow
3. ✅ Refund Workflow
4. ✅ Maintenance Scheduling Workflow
5. ✅ Charging Session Workflow

**Migration Strategy**:
```typescript
// Step 1: Create workflow definition
// apps/booking-service/src/workflows/booking.workflow.ts

// Step 2: Create activities
// apps/booking-service/src/activities/booking.activities.ts

// Step 3: Register worker
// apps/booking-service/src/temporal-worker.ts

// Step 4: Update booking controller to start workflow
// apps/booking-service/src/booking.controller.ts
@Post('book')
async createBooking(@Body() dto: CreateBookingDto) {
  const handle = await this.temporalClient.workflow.start(bookRideWorkflow, {
    taskQueue: 'booking-queue',
    workflowId: `booking-${dto.userId}-${Date.now()}`,
    args: [dto],
  });
  
  return {
    bookingId: handle.workflowId,
    status: 'PROCESSING'
  };
}
```

#### **Phase 3: Monitoring & Observability (Week 5)**

1. **Temporal UI Dashboard** (http://localhost:8088)
   - View all running workflows
   - Inspect workflow history
   - Retry failed workflows
   - Debug stuck workflows

2. **Integrate with existing monitoring**
   ```typescript
   // Add Temporal metrics to Prometheus
   import { PrometheusExporter } from '@temporalio/worker';
   
   const worker = await Worker.create({
     // ... existing config
     metricsExporter: new PrometheusExporter(),
   });
   ```

3. **Alerts for workflow failures**
   ```yaml
   # alertmanager.yml
   - alert: TemporalWorkflowFailed
     expr: temporal_workflow_failed_total > 10
     for: 5m
     labels:
       severity: critical
     annotations:
       summary: "High workflow failure rate"
   ```

---

### 📈 Temporal Benefits for Volteryde

| **Before Temporal** | **After Temporal** |
|---------------------|-------------------|
| ❌ Manual retry logic in every service | ✅ Automatic retries with exponential backoff |
| ❌ Lost state during crashes | ✅ Durable state persistence |
| ❌ Complex saga patterns for distributed transactions | ✅ Built-in compensation logic |
| ❌ No visibility into long-running processes | ✅ Full workflow history and monitoring |
| ❌ Difficult to handle human approvals | ✅ Native support for human-in-the-loop |
| ❌ Fragile booking and payment flows | ✅ Guaranteed execution of critical processes |

---

## 2️⃣ INKEEP - AI-Powered Documentation & Support Assistant

### 🔧 What Inkeep Solves for Volteryde

Inkeep transforms static documentation into an **intelligent AI assistant** that:
- ✅ Answers user questions instantly with citations
- ✅ Reduces support ticket volume by 60-70%
- ✅ Provides 24/7 multilingual support
- ✅ Identifies documentation gaps automatically
- ✅ Learns from support tickets to improve answers

### 📊 Inkeep Use Cases in Volteryde

#### **Use Case 1: Rider Support Assistant**

**Deploy in**: Mobile app, website, passenger portal

**Example Queries**:
- "How do I book a bus from Lagos to Abuja?"
- "What happens if I miss my bus?"
- "How do I get a refund for a cancelled ride?"
- "Why was my payment declined?"
- "Can I change my seat after booking?"

**Benefits**:
- ✅ Instant answers without waiting for human agents
- ✅ Reduces support tickets for common questions
- ✅ Available 24/7 in multiple languages (English, Yoruba, Igbo, Hausa)

#### **Use Case 2: Driver Support Assistant**

**Deploy in**: Driver mobile app, driver portal

**Example Queries**:
- "How do I report a vehicle issue?"
- "Where is the nearest charging station?"
- "How are my earnings calculated?"
- "What do I do if a passenger doesn't show up?"
- "How do I update my bank account for payments?"

**Benefits**:
- ✅ Drivers get instant answers while on the road
- ✅ Reduces driver support workload
- ✅ Improves driver satisfaction and retention

#### **Use Case 3: Internal Knowledge Base for Team**

**Deploy in**: Internal admin portal, Slack integration

**Example Queries**:
- "How do I approve a driver onboarding request?"
- "What is the refund policy for cancelled bookings?"
- "How do I run a fleet utilization report?"
- "What are the steps for vehicle maintenance escalation?"
- "Where is the API documentation for payment webhooks?"

**Benefits**:
- ✅ New team members onboard faster
- ✅ Reduces interruptions to senior engineers
- ✅ Centralized knowledge across departments

#### **Use Case 4: Developer Documentation Assistant**

**Deploy in**: Developer portal, API documentation

**Example Queries**:
- "How do I integrate the booking API?"
- "What webhook events are available for payment status?"
- "How do I authenticate API requests?"
- "What is the rate limit for the GPS tracking endpoint?"
- "Can you show me a code example for creating a booking?"

**Benefits**:
- ✅ Faster partner integrations
- ✅ Reduces support burden on engineering team
- ✅ Encourages API adoption

---

### 🛠️ Inkeep Implementation Plan

#### **Phase 1: Setup & Integration (Week 1)**

1. **Sign up for Inkeep** (Free tier available)
   - Visit https://inkeep.com
   - Create account and project for "Volteryde"

2. **Connect Documentation Sources**
   ```yaml
   # Inkeep Data Sources:
   - GitHub Wiki (internal docs)
   - Notion pages (process guides)
   - Confluence (if used)
   - Support ticket history (Zendesk/Intercom export)
   - API documentation (OpenAPI/Swagger specs)
   ```

3. **Embed Inkeep Widget in Applications**
   
   **For React/Next.js (Passenger Web App)**:
   ```tsx
   // components/InkeepChatWidget.tsx
   import { InkeepChatButton } from '@inkeep/react';
   
   export function InkeepChatWidget() {
     return (
       <InkeepChatButton
         apiKey={process.env.NEXT_PUBLIC_INKEEP_API_KEY}
         integrationId={process.env.NEXT_PUBLIC_INKEEP_INTEGRATION_ID}
         options={{
           primaryColor: '#FF6B35', // Volteryde brand color
           position: 'bottom-right',
           placeholder: 'Ask me anything about Volteryde...',
           chatButtonText: 'Need help?',
           suggestedQuestions: [
             'How do I book a ride?',
             'What payment methods are accepted?',
             'How do refunds work?',
           ],
         }}
       />
     );
   }
   ```

   **For React Native (Mobile Apps)**:
   ```tsx
   // components/InkeepMobileWidget.tsx
   import { InkeepMobileWidget } from '@inkeep/react-native';
   
   export function SupportChat() {
     return (
       <InkeepMobileWidget
         apiKey={INKEEP_API_KEY}
         integrationId={INKEEP_INTEGRATION_ID}
         options={{
           theme: 'light',
           primaryColor: '#FF6B35',
         }}
       />
     );
   }
   ```

#### **Phase 2: Train AI on Volteryde Knowledge (Week 2)**

1. **Upload Knowledge Base Content**
   - FAQ documents
   - User guides (rider, driver, fleet manager)
   - Policy documents (refund policy, cancellation policy)
   - Troubleshooting guides
   - API documentation

2. **Sync Support Ticket History**
   ```bash
   # Export resolved tickets from support system
   # Import into Inkeep for learning
   
   # Tickets should include:
   - User question
   - Agent response
   - Resolution
   - Category/tags
   ```

3. **Configure Answer Sources & Citations**
   ```yaml
   # Inkeep will cite sources in answers:
   "You can cancel a booking up to 2 hours before departure for a full refund."
   Source: Cancellation Policy (link)
   ```

#### **Phase 3: Multi-Language Support (Week 3)**

1. **Enable Automatic Translation**
   ```typescript
   // Inkeep supports automatic translation
   {
     languages: ['en', 'yo', 'ig', 'ha', 'fr'],
     defaultLanguage: 'en',
     autoDetect: true
   }
   ```

2. **Translate Key Documentation**
   - Translate top 20 FAQs to Yoruba, Igbo, Hausa
   - Translate booking flow guide
   - Translate payment help docs

#### **Phase 4: Analytics & Optimization (Week 4)**

1. **Monitor AI Performance**
   - Track answer accuracy rate
   - Identify unanswered questions (doc gaps)
   - Measure deflection rate (% of users who don't create tickets)

2. **Continuous Improvement**
   ```yaml
   # Weekly review:
   - Top 10 unanswered questions → Create documentation
   - Low confidence answers → Improve source content
   - User feedback (thumbs up/down) → Refine training
   ```

3. **Integration with Support Ticketing**
   ```typescript
   // If AI can't answer, escalate to human support
   {
     escalation: {
       enabled: true,
       createTicket: true, // Auto-create support ticket
       handoffMessage: "Let me connect you with a support agent..."
     }
   }
   ```

---

### 📈 Inkeep Benefits for Volteryde

| **Metric** | **Before Inkeep** | **After Inkeep** |
|------------|-------------------|------------------|
| **Support Ticket Volume** | 100% | 30-40% (60-70% deflection) |
| **Average Response Time** | 4-6 hours | Instant |
| **Support Cost per User** | High (human agents) | Low (AI + selective human) |
| **Support Coverage** | 9 AM - 6 PM | 24/7 |
| **Languages Supported** | English only | 5+ languages |
| **Knowledge Base Gaps** | Unknown | Auto-identified |

**ROI Calculation**:
- If you handle 1,000 support tickets/month
- At $5 per ticket cost (agent time)
- 70% deflection = 700 tickets saved
- **Monthly savings: $3,500**
- **Annual savings: $42,000**

---

## 3️⃣ FUMADOCS - Documentation Framework

### 🔧 What Fumadocs Solves for Volteryde

Fumadocs is a **Next.js-based documentation framework** that provides:
- ✅ Beautiful, professional documentation sites
- ✅ Built-in search with Algolia/Fuse.js
- ✅ API reference generation from OpenAPI specs
- ✅ Multi-language support
- ✅ SEO optimization
- ✅ Dark mode, responsive design
- ✅ Code syntax highlighting
- ✅ Interactive examples

### 📊 Fumadocs Use Cases in Volteryde

#### **Use Case 1: Public API Documentation**

**URL**: https://docs.volteryde.com/api

**Content**:
- API Overview & Authentication
- REST API Reference (auto-generated from OpenAPI spec)
- WebSocket API Reference
- Webhook Documentation
- SDKs & Code Examples (JavaScript, Python, Java)
- Rate Limits & Best Practices
- Changelog & Migration Guides

**Benefits**:
- ✅ Partners can integrate faster
- ✅ Reduces support questions
- ✅ Professional image for investors

#### **Use Case 2: Internal Technical Documentation**

**URL**: https://docs.volteryde.com/internal (private)

**Content**:
- System Architecture Overview
- Domain-Driven Design Boundaries
- Database Schemas
- Event Bus Topics & Schemas
- Deployment Processes (CI/CD)
- Development Setup Guide
- Coding Standards & Best Practices
- Troubleshooting Guides

**Benefits**:
- ✅ New engineers onboard faster
- ✅ Reduces knowledge silos
- ✅ Better collaboration across teams

#### **Use Case 3: User Knowledge Base**

**URL**: https://help.volteryde.com

**Content**:
- How to Book a Ride (step-by-step)
- Payment Methods & Wallet Guide
- Refund & Cancellation Policy
- Safety & Security Guidelines
- FAQ (riders, drivers, fleet managers)
- Troubleshooting (app issues, payment errors)
- Contact Support

**Benefits**:
- ✅ Self-service support reduces ticket volume
- ✅ SEO-friendly (Google indexing)
- ✅ Multi-language support

#### **Use Case 4: Integration Guides for Partners**

**URL**: https://docs.volteryde.com/integrations

**Content**:
- How to Integrate Paystack Payments
- Google Maps API Setup
- Firebase Cloud Messaging (Push Notifications)
- Twilio SMS Configuration
- Corporate Partner API Integration
- Bus Operator Dashboard Setup

**Benefits**:
- ✅ Enables self-service integrations
- ✅ Reduces engineering support time
- ✅ Scales partnerships

---

### 🛠️ Fumadocs Implementation Plan

#### **Phase 1: Setup Fumadocs Project (Week 1)**

1. **Create Documentation Site**
   ```bash
   # Create new Next.js project with Fumadocs
   npx create-next-app@latest volteryde-docs --typescript
   cd volteryde-docs
   
   # Install Fumadocs
   pnpm add fumadocs-ui fumadocs-core fumadocs-mdx
   pnpm add -D fumadocs-cli
   ```

2. **Configure Fumadocs**
   ```typescript
   // fumadocs.config.ts
   import { defineConfig } from 'fumadocs-cli';
   
   export default defineConfig({
     content: {
       docs: 'content/docs',
       blog: 'content/blog',
     },
     search: {
       enabled: true,
       provider: 'fuse', // or 'algolia' for better search
     },
     theme: {
       primaryColor: '#FF6B35', // Volteryde brand color
       darkMode: true,
     },
     i18n: {
       locales: ['en', 'yo', 'ig', 'ha'],
       defaultLocale: 'en',
     },
   });
   ```

3. **Setup Documentation Structure**
   ```
   volteryde-docs/
   ├── content/
   │   ├── docs/
   │   │   ├── api/
   │   │   │   ├── authentication.mdx
   │   │   │   ├── booking.mdx
   │   │   │   ├── payments.mdx
   │   │   │   └── webhooks.mdx
   │   │   ├── guides/
   │   │   │   ├── getting-started.mdx
   │   │   │   ├── booking-flow.mdx
   │   │   │   └── payment-integration.mdx
   │   │   ├── internal/
   │   │   │   ├── architecture.mdx
   │   │   │   ├── deployment.mdx
   │   │   │   └── development-setup.mdx
   │   │   └── faq/
   │   │       ├── riders.mdx
   │   │       ├── drivers.mdx
   │   │       └── fleet-managers.mdx
   │   └── blog/
   │       └── changelog/
   └── public/
       └── api/
           └── openapi.json
   ```

#### **Phase 2: Generate API Documentation (Week 2)**

1. **Auto-generate from OpenAPI Specs**
   ```typescript
   // lib/generate-api-docs.ts
   import { generateDocs } from 'fumadocs-openapi';
   
   await generateDocs({
     input: './public/api/openapi.json',
     output: './content/docs/api',
     template: 'fumadocs',
   });
   ```

2. **Create OpenAPI Spec for Each Domain**
   ```yaml
   # public/api/booking-api.yaml
   openapi: 3.0.0
   info:
     title: Volteryde Booking API
     version: 1.0.0
     description: API for discovering buses and booking rides
   
   servers:
     - url: https://api.volteryde.com/v1
   
   paths:
     /buses/nearby:
       get:
         summary: Find nearby buses
         parameters:
           - name: lat
             in: query
             required: true
             schema:
               type: number
           - name: lng
             in: query
             required: true
             schema:
               type: number
         responses:
           200:
             description: List of nearby buses
             content:
               application/json:
                 schema:
                   type: array
                   items:
                     $ref: '#/components/schemas/Bus'
   
   components:
     schemas:
       Bus:
         type: object
         properties:
           id:
             type: string
           route:
             type: string
           currentLocation:
             $ref: '#/components/schemas/Location'
           availableSeats:
             type: integer
   ```

#### **Phase 3: Write Core Documentation (Week 3-4)**

1. **API Documentation**
   - Authentication & Authorization
   - Booking API endpoints
   - Payment API endpoints
   - Telematics API endpoints
   - Fleet Management API endpoints
   - Webhook events
   - Error codes & handling

2. **User Guides**
   - Rider: How to book, pay, track rides
   - Driver: How to manage routes, earnings, maintenance
   - Fleet Manager: How to manage fleet, reports, analytics

3. **Internal Documentation**
   - Architecture overview (copy from DDD_ARCHITECTURE_SUMMARY.md)
   - Deployment guide
   - Development setup
   - Database schemas
   - Event bus topics

4. **Integration Guides**
   - Paystack payment integration
   - Google Maps setup
   - Firebase FCM setup
   - Partner API integration

#### **Phase 4: Add Interactive Features (Week 5)**

1. **API Playground (Try It Out)**
   ```typescript
   // components/ApiPlayground.tsx
   import { ApiPlayground } from 'fumadocs-ui/components/api-playground';
   
   export function BookingApiDemo() {
     return (
       <ApiPlayground
         endpoint="https://api.volteryde.com/v1/buses/nearby"
         method="GET"
         parameters={[
           { name: 'lat', type: 'number', required: true },
           { name: 'lng', type: 'number', required: true },
         ]}
         authentication="bearer"
       />
     );
   }
   ```

2. **Code Examples with Tabs**
   ```mdx
   ## Book a Ride
   
   <Tabs items={['JavaScript', 'Python', 'Java', 'cURL']}>
   <Tab value="JavaScript">
   ```js
   const response = await fetch('https://api.volteryde.com/v1/bookings', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer YOUR_API_KEY',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       busId: 'bus-123',
       segment: { from: 'Lagos', to: 'Ibadan' },
       userId: 'user-456'
     })
   });
   ```
   </Tab>
   <Tab value="Python">
   ```python
   import requests
   
   response = requests.post(
     'https://api.volteryde.com/v1/bookings',
     headers={'Authorization': 'Bearer YOUR_API_KEY'},
     json={
       'busId': 'bus-123',
       'segment': {'from': 'Lagos', 'to': 'Ibadan'},
       'userId': 'user-456'
     }
   )
   ```
   </Tab>
   </Tabs>
   ```

3. **Search Integration**
   ```bash
   # Add Algolia for better search (optional, free tier available)
   pnpm add @docsearch/react
   ```

#### **Phase 5: Deploy & Maintain (Week 6)**

1. **Deploy to Vercel**
   ```bash
   # Deploy to Vercel (free for open-source)
   vercel --prod
   
   # Custom domains:
   # - docs.volteryde.com (public API docs)
   # - help.volteryde.com (user knowledge base)
   # - internal.volteryde.com (internal docs, password protected)
   ```

2. **Setup CI/CD for Auto-Deploy**
   ```yaml
   # .github/workflows/docs-deploy.yml
   name: Deploy Documentation
   
   on:
     push:
       branches: [main]
       paths:
         - 'content/**'
         - 'public/api/**'
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: pnpm/action-setup@v2
         - run: pnpm install
         - run: pnpm build
         - uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
   ```

3. **Maintenance Process**
   - Update docs when API changes
   - Add new guides based on support tickets
   - Keep changelog up to date
   - Review analytics to identify missing content

---

### 📈 Fumadocs Benefits for Volteryde

| **Aspect** | **Before Fumadocs** | **After Fumadocs** |
|------------|---------------------|-------------------|
| **API Documentation** | None or outdated | Professional, auto-generated from OpenAPI |
| **User Guides** | Scattered Google Docs | Searchable, SEO-optimized knowledge base |
| **Developer Onboarding** | 2-3 weeks | 3-5 days with comprehensive docs |
| **Partner Integrations** | Requires hand-holding | Self-service with guides & examples |
| **Support Ticket Volume** | High (missing docs) | Lower (self-service docs) |
| **Credibility with Investors** | Looks like early-stage | Professional, production-ready |

---

## 🗓️ Implementation Timeline

### Overall Rollout Schedule (6 Weeks)

| **Week** | **Temporal** | **Inkeep** | **Fumadocs** |
|----------|--------------|------------|--------------|
| **Week 1** | Setup infrastructure, install SDKs | Sign up, connect data sources | Create project, setup structure |
| **Week 2** | Create Temporal module, define booking workflow | Train AI, upload knowledge base | Generate API docs from OpenAPI |
| **Week 3** | Migrate booking & payment workflows | Enable multi-language support | Write user guides & internal docs |
| **Week 4** | Add fleet operations workflows | Analytics & optimization | Add interactive features |
| **Week 5** | Monitoring & observability | Integration with support ticketing | Code examples & API playground |
| **Week 6** | Production rollout | Production rollout | Deploy to Vercel, setup CI/CD |

---

## 💰 Cost Analysis

| **Tool** | **Free Tier** | **Paid Tier** | **Recommended for Volteryde** |
|----------|---------------|---------------|------------------------------|
| **Temporal** | ✅ Self-hosted (free, unlimited) | Temporal Cloud ($200+/month) | **Start with self-hosted** (Docker Compose) |
| **Inkeep** | ✅ Free up to 500 questions/month | $99/month (10K questions) | **Start with free tier**, upgrade as you grow |
| **Fumadocs** | ✅ 100% free (open-source) | N/A | **Free forever** |

**Total Cost to Start**: **$0** (all free tiers)

**Estimated Cost at Scale** (10K+ monthly users):
- Temporal: $0 (self-hosted) or $200/month (cloud)
- Inkeep: $99/month (worth it for support cost savings)
- Fumadocs: $0
- **Total: $99-$299/month**

**ROI**: If Inkeep deflects 700 support tickets/month at $5/ticket = **$3,500 saved/month**  
**Net Benefit**: $3,500 - $299 = **$3,201/month saved** 🎉

---

## 📊 Success Metrics

### Temporal Metrics
- ✅ **Workflow Success Rate**: Target 99.9%
- ✅ **Booking Completion Rate**: Increase from 85% to 95%+
- ✅ **Payment Failure Recovery**: 90% of transient failures auto-resolved
- ✅ **Average Workflow Duration**: Track booking flow from start to completion

### Inkeep Metrics
- ✅ **Deflection Rate**: Target 60-70% (users get answers without creating tickets)
- ✅ **Answer Accuracy**: Target 85%+ (thumbs up rate)
- ✅ **Support Ticket Reduction**: Target 50-70% decrease
- ✅ **User Satisfaction**: Track CSAT scores for AI interactions

### Fumadocs Metrics
- ✅ **Documentation Coverage**: 100% of public APIs documented
- ✅ **Developer Onboarding Time**: Reduce from 2-3 weeks to 3-5 days
- ✅ **Self-Service Integration Success**: 70%+ of partners integrate without support
- ✅ **Documentation Traffic**: Track docs.volteryde.com visitors

---

## 🚀 Quick Start Checklist

### Week 1 Priorities

**Temporal**:
- [ ] Deploy Temporal server with Docker Compose
- [ ] Install @temporalio/client in booking-service
- [ ] Create first workflow: Simple booking workflow POC
- [ ] Test workflow execution and retry logic

**Inkeep**:
- [ ] Sign up at inkeep.com
- [ ] Upload top 20 FAQs
- [ ] Embed widget in passenger web app (test environment)
- [ ] Test AI responses with sample questions

**Fumadocs**:
- [ ] Create new Next.js project with Fumadocs
- [ ] Setup documentation structure (content/docs folders)
- [ ] Migrate DDD_ARCHITECTURE_SUMMARY.md to Fumadocs
- [ ] Write "Getting Started" guide

---

## 🎯 Next Steps

1. **Review this plan** with engineering and product teams
2. **Assign owners** for each tool integration
3. **Set up weekly check-ins** to track progress
4. **Start with Temporal** (Week 1-2) as it's the most critical
5. **Deploy Inkeep in parallel** (Week 1-2) for quick wins
6. **Build Fumadocs incrementally** (Week 1-6) as documentation is written

---

## 📚 Resources

### Temporal
- Official Docs: https://docs.temporal.io
- NestJS Integration: https://docs.temporal.io/application-development/foundations#typescript
- Java SDK: https://docs.temporal.io/develop/java
- Tutorials: https://learn.temporal.io

### Inkeep
- Official Docs: https://docs.inkeep.com
- React Integration: https://docs.inkeep.com/integrations/react
- API Reference: https://docs.inkeep.com/api-reference

### Fumadocs
- Official Docs: https://fumadocs.vercel.app
- GitHub: https://github.com/fuma-nama/fumadocs
- OpenAPI Integration: https://fumadocs.vercel.app/docs/ui/openapi
- Examples: https://fumadocs.vercel.app/showcase

---

## 🤝 Support

For questions or assistance with this integration plan:
- **Technical Lead**: [Assign owner]
- **Product Manager**: [Assign owner]
- **Engineering Team**: Use #volteryde-integration Slack channel

---

**Last Updated**: November 11, 2025  
**Status**: Ready for Implementation ✅  
**Estimated Completion**: 6 weeks from start date
