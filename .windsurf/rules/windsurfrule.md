---
trigger: always_on
---

# Windsurf Rules for Volteryde Platform

## MANDATORY REQUIREMENTS FOR ALL NEW FEATURES

### ⚠️ CRITICAL: Every new feature MUST include ALL THREE components - NO EXCEPTIONS:

### 1. ✅ Unit Tests (REQUIRED)
- Write comprehensive unit tests using Jest (NestJS) or JUnit (Java)
- Place tests adjacent to the code: `*.spec.ts` (NestJS) or `*Test.java` (Java)
- Test both success and error cases
- Ensure minimum coverage for all new code paths
- Run tests with: 
  - NestJS: `pnpm test` in service directory
  - Java: `./mvnw test` in service directory

### 2. ✅ UI Components (REQUIRED)
- Add corresponding UI components in relevant apps:
  - Mobile: `/apps/mobile-app/` or `/apps/driver-app/` (React Native)
  - Web: `/apps/admin-dashboard/`, `/apps/support-app/`, `/apps/bi-partner-app/` (React)
- Include form validation schemas using Zod or Yup
- Use the existing UI component library (shadcn/ui for web, React Native components for mobile)
- Ensure forms have proper validation and error handling
- Follow existing patterns in each app

### 3. ✅ Documentation (REQUIRED)
- Create or update documentation in `/docs/Volteryde Application Requirements/`
- Use Markdown format for documentation files (`.md` extension)
- Add technical specifications to relevant guides (API docs, architecture docs)
- Follow existing documentation structure
- Add code examples and diagrams where helpful
- Update README files in service/app directories

## VERIFICATION CHECKLIST
Before considering any feature complete, verify:
- [ ] Tests written and passing (`pnpm test` or `./mvnw test`)
- [ ] UI components implemented in relevant apps
- [ ] Documentation added or updated
- [ ] All linting passes (`pnpm lint`)
- [ ] Code follows existing patterns and conventions
- [ ] Environment variables documented in `.env.example`

## PROJECT CONTEXT

This is the Volteryde Platform - an electric mobility platform with microservices architecture and Domain-Driven Design.

### Core Technologies
- **Backend Services**: 
  - NestJS/TypeScript (Telematics, Booking, Fleet Ops, Charging domains)
  - Java/Spring Boot (Authentication, Payment domains)
- **Frontend Apps**:
  - React Native (Mobile Passenger App, Mobile Driver App)
  - React/Next.js (Admin Dashboard, Support App, BI Partner App, Docs Platform)
- **Databases**: PostgreSQL, TimescaleDB/InfluxDB, Redis
- **Infrastructure**: AWS, Terraform, Kubernetes (EKS), Docker
- **Workflow Orchestration**: Temporal
- **Event Bus**: Kafka/RabbitMQ
- **Testing**: Jest (NestJS), JUnit (Java), React Testing Library
- **Validation**: Zod, class-validator

### Key Directories
- `/services/` - Backend microservices (domain-driven)
  - `/services/volteryde-nest/` - NestJS services
  - `/services/volteryde-springboot/` - Java Spring Boot services
- `/apps/` - Frontend applications
  - `/apps/mobile-app/` - Passenger mobile app (React Native)
  - `/apps/driver-app/` - Driver apps (mobile & web)
  - `/apps/admin-dashboard/` - Admin dashboard (React)
  - `/apps/support-app/` - Support interface (React)
  - `/apps/bi-partner-app/` - Business intelligence dashboard (React)
  - `/apps/docs-platform/` - Documentation site
- `/workers/` - Temporal workflow workers
- `/infrastructure/` - Terraform and Kubernetes configs
- `/packages/` - Shared libraries and configs
- `/docs/` - Documentation and requirements

### Development Commands
```bash
# NestJS services
cd services/volteryde-nest
pnpm install
pnpm dev              # Start development server
pnpm test             # Run test suite with Jest
pnpm test:cov         # Run tests with coverage
pnpm build            # Build for production
pnpm lint             # Run ESLint

# Java services
cd services/volteryde-springboot
./mvnw spring-boot:run    # Start development server
./mvnw test               # Run JUnit tests
./mvnw clean package      # Build for production

# React Native mobile apps
cd apps/mobile-app
pnpm install
pnpm start            # Start Metro bundler
pnpm android          # Run on Android
pnpm ios              # Run on iOS
pnpm test             # Run tests

# React web apps
cd apps/admin-dashboard  # or other web app
pnpm install
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm lint             # Run linter

# Infrastructure
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Docker Compose (local development)
docker-compose up -d
```

## CENTRALIZED ARCHITECTURE MANDATES

### 1. Response Handling
- **NEVER** manually format responses in controllers.
- Return the data object directly.
- The `TransformInterceptor` will wrap it in `{ data, timestamp, status }`.

### 2. Error Handling
- **NEVER** use `try-catch` blocks to return error responses manually.
- Throw standard NestJS exceptions (e.g., `throw new BadRequestException('Invalid input')`).
- The `HttpExceptionFilter` will format the error response.

### 3. Configuration
- **NEVER** use `process.env` directly in services or controllers.
- Inject `ConfigService` and use the typed configuration (e.g., `configService.get('database.host')`).

### 4. Database Access
- **ALWAYS** use the centralized `DatabaseModule`.
- Do not create separate connection providers.

### 5. User Context
- **ALWAYS** use the `@CurrentUser()` decorator to access the authenticated user in controllers.
- Do not access `req.user` directly.

## CODE PATTERNS TO FOLLOW

### NestJS Testing Pattern
```typescript
// services/volteryde-nest/src/telematics/__tests__/telematics.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { TelematicsService } from '../telematics.service';

describe('TelematicsService', () => {
  let service: TelematicsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelematicsService],
    }).compile();

    service = module.get<TelematicsService>(TelematicsService);
  });

  it('should handle success case', async () => {
    // Test implementation
  });

  it('should handle error case', async () => {
    // Test error handling
  });
});
```

### Java Testing Pattern
```java
// services/volteryde-springboot/src/test/java/com/volteryde/auth/AuthServiceTest.java
package com.volteryde.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class AuthServiceTest {
    
    @Test
    void shouldHandleSuccessCase() {
        // Test implementation
    }
    
    @Test
    void shouldHandleErrorCase() {
        // Test error handling
    }
}
```

### React Native Component Pattern
```tsx
// apps/mobile-app/src/components/booking/BookingForm.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const bookingSchema = z.object({
  busId: z.string().min(1, 'Bus ID is required'),
  seatNumber: z.number().min(1).max(50),
  // ... other fields
});

export function BookingForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(bookingSchema)
  });
  
  return (
    <View>
      {/* Component implementation */}
    </View>
  );
}
```

### React Web Component Pattern
```tsx
// apps/admin-dashboard/src/components/fleet/VehicleForm.tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';

const vehicleSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  // ... other fields
});

export function VehicleForm() {
  const form = useForm({
    resolver: zodResolver(vehicleSchema)
  });
  
  return (
    <Form {...form}>
      {/* Component implementation */}
    </Form>
  );
}
```

### NestJS Service Pattern
```typescript
// services/volteryde-nest/src/booking/booking.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async createBooking(createBookingDto: CreateBookingDto) {
    // Service implementation
  }
}
```

### Temporal Workflow Pattern
```typescript
// workers/temporal-workers/src/workflows/booking.workflow.ts
import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';

const { reserveSeat, processPayment, confirmBooking } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

export async function bookRideWorkflow(request: BookingRequest) {
  try {
    const reservation = await reserveSeat(request);
    const payment = await processPayment(request);
    
    if (!payment.success) {
      await releaseSeat(reservation.id);
      throw new Error('Payment failed');
    }
    
    return await confirmBooking(reservation, payment);
  } catch (error) {
    // Compensation logic
    throw error;
  }
}
```

### Documentation Pattern
```markdown
// docs/Volteryde Application Requirements/API_DOCUMENTATION.md
# Booking API

## Overview
Brief description of the booking API.

## Endpoints

### POST /api/bookings
Create a new booking.

#### Request
```typescript
{
  busId: string;
  seatNumber: number;
  userId: string;
}
```

#### Response
```typescript
{
  bookingId: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
}
```

## Examples
Practical examples with curl or code snippets.
```

## IMPORTANT RULES

1. **Never skip tests** - Every new feature needs tests
2. **Never skip UI** - If it's a user-facing feature, it needs UI components
3. **Never skip docs** - All features need documentation
4. **Use existing patterns** - Follow established code patterns
5. **Validate input** - Always use Zod schemas or class-validator for validation
6. **Handle errors** - Implement proper error handling
7. **Preserve domain boundaries** - Respect DDD bounded contexts
8. **Maintain type safety** - Use TypeScript properly
9. **Follow conventions** - Match existing code style
10. **Test before committing** - Run tests and linting
11. **Event-driven architecture** - Use Kafka/RabbitMQ for inter-domain communication
12. **Temporal for workflows** - Use Temporal for long-running, mission-critical processes

## CONTEXT AWARENESS

When working on this codebase:
- Understand the Domain-Driven Design (DDD) architecture
- Respect bounded context boundaries (6 domains)
- Use event-driven patterns for inter-domain communication
- Follow Single Source of Truth principle (Telematics domain owns vehicle state)
- Implement proper retry logic and error handling
- Use Temporal for durable workflow execution
- Maintain database per domain pattern
- Ensure proper secrets management (AWS Secrets Manager)
- Implement proper logging and monitoring (Prometheus, Grafana)

## DATABASE MIGRATION PRACTICES

### NestJS/TypeORM Workflow
1. Edit entity files in `src/*/entities/*.entity.ts`
2. Run `pnpm migration:generate -- src/migrations/MigrationName`
3. Review the generated migration file
4. Run `pnpm migration:run` to apply migrations

### Java/Spring Boot Workflow
1. Edit entity files in `src/main/java/com/volteryde/*/entity/*.java`
2. Use Liquibase or Flyway for migrations
3. Create migration file in `src/main/resources/db/migration/`
4. Follow naming convention: `V{version}__{description}.sql`
5. Run application to apply migrations automatically

### Critical Migration Rules
- ⚠️ **NEVER edit existing migration files after they've been applied** - create new migrations instead
- ⚠️ **Test migrations locally first** before deploying to staging/production
- ⚠️ **Always have rollback scripts ready** for production migrations
- ✅ **Use transactions** where possible to ensure atomicity
- ✅ **Backup databases** before running migrations in production

## ARCHITECTURE PRINCIPLES

### Domain-Driven Design
- **6 Bounded Contexts**: Authentication, Payment, Telematics, Booking, Fleet Operations, Charging
- Each domain has its own database and service
- Domains communicate via events (Kafka) or direct API calls

### Technology Alignment
- **Java/Spring Boot**: Security-critical domains (Auth, Payment)
- **NestJS/TypeScript**: Business logic domains (Telematics, Booking, Fleet, Charging)
- **Temporal**: Mission-critical workflows (booking, payment, fleet operations)

### Infrastructure as Code
- All infrastructure defined in Terraform
- Kubernetes manifests for container orchestration
- GitOps workflow for deployments

## ERROR MESSAGES

When encountering issues, provide clear guidance:
- If tests are missing: "This feature requires unit tests. Add tests adjacent to the implementation file."
- 