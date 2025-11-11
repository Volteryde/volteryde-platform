# Repository Structure & Organization Guide
## Volteryde Platform - Monorepo Architecture

---

## Decision: Monorepo Approach

### Why Monorepo?

**✅ Chosen Approach**: Single monorepo with domain-based organization

**Justification**:
1. **Atomic Changes Across Services** - Single PR can update contracts, shared types, and consumers
2. **Unified Version Control** - Single source of truth for all platform code
3. **Easier Refactoring** - IDEs can find all usages across services
4. **Shared Tooling** - Single ESLint, Prettier, TypeScript config
5. **Simplified CI/CD** - One pipeline definition, selective deployments
6. **Better Developer Experience** - Clone once, run entire platform locally

**Trade-offs Accepted**:
- ⚠️ Large repo size (mitigated with Git LFS for binaries)
- ⚠️ Longer CI runs (mitigated with selective testing based on changed paths)
- ⚠️ Access control complexity (mitigated with CODEOWNERS file)

---

## Repository Folder Structure

```
volteryde-platform/
│
├── .github/                                # GitHub configuration
│   ├── workflows/                          # GitHub Actions CI/CD
│   │   ├── ci-backend-java.yml
│   │   ├── ci-backend-nestjs.yml
│   │   ├── ci-frontend.yml
│   │   ├── deploy-dev.yml
│   │   ├── deploy-staging.yml
│   │   ├── deploy-production.yml
│   │   ├── terraform-plan.yml
│   │   └── security-scan.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── CODEOWNERS                          # Auto-assign reviewers by path
│
├── docs/                                   # Platform documentation
│   ├── architecture/                       # Architecture Decision Records (ADRs)
│   │   ├── 001-monorepo-decision.md
│   │   ├── 002-ddd-bounded-contexts.md
│   │   ├── 003-temporal-for-workflows.md
│   │   └── 004-java-for-security.md
│   ├── api/                                # API documentation (OpenAPI specs)
│   │   ├── authentication.yaml
│   │   ├── booking.yaml
│   │   ├── payments.yaml
│   │   └── telematics.yaml
│   ├── guides/                             # Developer guides
│   │   ├── getting-started.md
│   │   ├── local-development.md
│   │   ├── testing-strategy.md
│   │   └── deployment-process.md
│   └── runbooks/                           # Operational runbooks
│       ├── incident-response.md
│       ├── scaling-procedures.md
│       └── disaster-recovery.md
│
├── infrastructure/                         # Infrastructure as Code
│   ├── terraform/                          # Terraform modules
│   │   ├── modules/                        # Reusable modules
│   │   │   ├── eks-cluster/
│   │   │   ├── rds-postgres/
│   │   │   ├── elasticache-redis/
│   │   │   ├── vpc-networking/
│   │   │   └── s3-bucket/
│   │   ├── environments/                   # Environment-specific configs
│   │   │   ├── dev/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── shared/                         # Shared terraform state backend
│   │       ├── backend.tf
│   │       └── remote-state.tf
│   │
│   └── kubernetes/                         # Kubernetes manifests
│       ├── base/                           # Base configurations
│       │   ├── namespace.yaml
│       │   ├── configmap.yaml
│       │   └── secret-template.yaml
│       └── overlays/                       # Environment overlays (Kustomize)
│           ├── dev/
│           ├── staging/
│           └── production/
│
├── services/                               # Backend services (Technology-grouped)
│   ├── volteryde-springboot/               # Java Spring Boot Application
│   │   ├── src/main/java/com/volteryde/
│   │   │   ├── authentication/             # Authentication module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── models/
│   │   │   │   └── config/
│   │   │   ├── payment/                    # Payment module
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── models/
│   │   │   │   └── integrations/
│   │   │   └── shared/                     # Shared utilities
│   │   │       ├── config/
│   │   │       ├── security/
│   │   │       ├── exceptions/
│   │   │       └── utils/
│   │   ├── src/main/resources/
│   │   │   ├── application.yml
│   │   │   ├── application-dev.yml
│   │   │   ├── application-staging.yml
│   │   │   └── application-production.yml
│   │   ├── Dockerfile
│   │   ├── pom.xml
│   │   └── README.md
│   │
│   └── volteryde-nest/                     # NestJS Application
│       ├── src/
│       │   ├── telematics/                 # Telematics module
│       │   │   ├── telematics.module.ts
│       │   │   ├── telematics.controller.ts
│       │   │   ├── telematics.service.ts
│       │   │   ├── entities/
│       │   │   └── dto/
│       │   ├── booking/                    # Booking module
│       │   │   ├── booking.module.ts
│       │   │   ├── booking.controller.ts
│       │   │   ├── booking.service.ts
│       │   │   ├── entities/
│       │   │   └── dto/
│       │   ├── fleet-operations/           # Fleet operations module
│       │   │   ├── fleet.module.ts
│       │   │   ├── fleet.controller.ts
│       │   │   ├── fleet.service.ts
│       │   │   └── entities/
│       │   ├── charging/                   # Charging infrastructure module
│       │   │   ├── charging.module.ts
│       │   │   ├── charging.controller.ts
│       │   │   ├── charging.service.ts
│       │   │   └── entities/
│       │   ├── shared/                     # Shared utilities
│       │   │   ├── database/
│       │   │   │   └── database.module.ts
│       │   │   ├── auth/
│       │   │   │   ├── auth.guard.ts
│       │   │   │   └── jwt.strategy.ts
│       │   │   ├── kafka/
│       │   │   │   └── kafka.module.ts
│       │   │   └── guards/
│       │   │       ├── roles.guard.ts
│       │   │       └── api-key.guard.ts
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── test/
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       ├── nest-cli.json
│       └── README.md
│
├── workers/                                # Background workers
│   └── temporal-workers/                   # Temporal workflow workers
│       ├── src/
│       │   ├── activities/
│       │   │   ├── booking-activities.ts
│       │   │   ├── payment-activities.ts
│       │   │   └── fleet-activities.ts
│       │   ├── workflows/
│       │   │   ├── booking-workflow.ts
│       │   │   ├── payment-workflow.ts
│       │   │   └── fleet-workflow.ts
│       │   └── workers/
│       │       ├── booking-worker.ts
│       │       ├── payment-worker.ts
│       │       └── fleet-worker.ts
│       ├── Dockerfile
│       ├── package.json
│       └── README.md
│
├── apps/                                   # Frontend applications (6 total)
│   ├── mobile-passenger-app/               # React Native - Passenger booking
│   │   ├── src/
│   │   ├── android/
│   │   ├── ios/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── mobile-driver-app/                  # React Native - Driver operations
│   │   ├── src/
│   │   ├── android/
│   │   ├── ios/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── admin-dashboard/                    # React - Super admin panel
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── driver-app/                         # React PWA - Driver web app
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── support-app/                        # React - Customer support interface
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── bi-partner-app/                     # React - Business intelligence & partner dashboard
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── README.md
│
├── packages/                               # Shared libraries
│   ├── shared-types/                       # TypeScript type definitions
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── ui-components/                      # Shared UI components
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── auth-sdk/                           # Authentication SDK
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── utils/                              # Common utilities
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── scripts/                                # Build & deployment scripts
│   ├── setup-local.sh                      # Local environment setup
│   ├── deploy.sh                           # Deployment script
│   ├── db-migrate.sh                       # Database migration
│   └── smoke-tests.sh                      # Post-deployment smoke tests
│
├── .husky/                                 # Git hooks
│   ├── pre-commit                          # Run linting before commit
│   └── commit-msg                          # Validate commit message format
│
├── .gitignore                              # Git ignore patterns
├── .eslintrc.js                            # ESLint configuration
├── .prettierrc                             # Prettier configuration
├── pnpm-workspace.yaml                     # pnpm workspace config
├── package.json                            # Root package.json
├── tsconfig.json                           # TypeScript base config
└── README.md                               # Main README
│       ├── src/
│       └── package.json
│
├── scripts/                                # Automation scripts
│   ├── setup-dev-environment.sh            # Local setup automation
│   ├── build-all-services.sh               # Build all Docker images
│   ├── run-local-stack.sh                  # Start local Docker Compose
│   ├── deploy-to-k8s.sh                    # Kubernetes deployment helper
│   └── seed-test-data.sh                   # Database seeding for dev/staging
│
├── .devcontainer/                          # VS Code Dev Container
│   ├── devcontainer.json
│   └── Dockerfile
│
├── .husky/                                 # Git hooks
│   ├── pre-commit                          # Runs linters before commit
│   └── pre-push                            # Runs tests before push
│
├── docker-compose.yml                      # Local development stack
├── docker-compose.override.yml             # Developer-specific overrides
├── .env.example                            # Environment variables template
├── .gitignore
├── .gitattributes                          # Git LFS configuration
├── README.md                               # Main repository README
├── CONTRIBUTING.md                         # Contribution guidelines
├── CHANGELOG.md                            # Version history
├── LICENSE
├── package.json                            # Root package.json for workspaces
├── pnpm-workspace.yaml                     # pnpm workspace configuration
└── Makefile                                # Common tasks (make setup, make test, make deploy)
```

---

## Branching Strategy

### GitFlow Model (Adapted)

```
main (production)
  ↑
  └── release/v1.2.0
        ↑
        └── develop (staging)
              ↑
              ├── feature/booking-temporal-integration
              ├── feature/payment-refund-workflow
              ├── bugfix/seat-locking-race-condition
              └── hotfix/payment-webhook-timeout
```

### Branch Types

| Branch Type | Naming | Purpose | Merges To |
|-------------|--------|---------|-----------|
| **main** | `main` | Production code | N/A (protected) |
| **develop** | `develop` | Staging environment | `main` via release branch |
| **feature** | `feature/[ticket]-[description]` | New features | `develop` |
| **bugfix** | `bugfix/[ticket]-[description]` | Bug fixes | `develop` |
| **hotfix** | `hotfix/[description]` | Critical production fixes | `main` AND `develop` |
| **release** | `release/v[version]` | Release preparation | `main` |

### Branch Protection Rules

**`main` branch**:
- ✅ Require pull request reviews (min 2 approvers)
- ✅ Require status checks to pass (CI tests, security scans)
- ✅ Require signed commits
- ✅ Restrict who can push (DevOps team only)
- ✅ Require linear history (no merge commits)

**`develop` branch**:
- ✅ Require pull request reviews (min 1 approver)
- ✅ Require status checks to pass
- ✅ Allow rebase and merge

---

## Pull Request Process

### 1. Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/VLT-123-temporal-booking-workflow
```

### 2. Make Changes and Commit
```bash
# Stage changes
git add .

# Pre-commit hook auto-runs:
# - ESLint
# - Prettier
# - Type checking
# - Unit tests for changed files

git commit -m "feat(booking): implement Temporal workflow for seat reservation

- Add BookingWorkflow with compensation logic
- Integrate with Paystack payment activity
- Add retry policies for transient failures

Closes VLT-123"
```

### 3. Push and Create PR
```bash
git push origin feature/VLT-123-temporal-booking-workflow

# GitHub CLI (optional)
gh pr create --base develop --title "feat(booking): Temporal workflow for bookings" --body "..."
```

### 4. PR Template Auto-Populated
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [x] New feature
- [ ] Breaking change
- [ ] Documentation update

## Checklist
- [x] Tests added/updated
- [x] Documentation updated
- [x] No breaking changes
- [x] CI pipeline passes
- [x] Reviewed by domain expert

## Related Issues
Closes #123

## Screenshots (if applicable)

## Deployment Notes
Requires database migration in booking-domain
```

### 5. Code Review
- **Auto-assigned reviewers** via CODEOWNERS
- **Required approvals**: 2 for critical paths (auth, payment), 1 for others
- **Review checklist**:
  - ✅ Code quality and readability
  - ✅ Test coverage >80%
  - ✅ No security vulnerabilities
  - ✅ Follows domain boundaries
  - ✅ Performance considerations
  - ✅ Backward compatibility

### 6. Automated Checks (GitHub Actions)
- **Build**: Compile Java and TypeScript services
- **Test**: Run unit tests, integration tests
- **Lint**: ESLint, Prettier, SonarQube
- **Security Scan**: Trivy (container), Snyk (dependencies)
- **Terraform Validate**: Check infrastructure changes
- **E2E Tests**: Playwright/Cypress for critical flows

### 7. Merge
```bash
# Squash and merge (preferred for feature branches)
# Rebase and merge (for small fixes)
# No merge commits to keep history clean
```

---

## Code Review Guidelines

### What to Look For

**Architecture**:
- Does this change belong in the correct domain?
- Are domain boundaries respected?
- Is the event schema backward compatible?

**Code Quality**:
- DRY (Don't Repeat Yourself)
- SOLID principles
- Meaningful variable names
- Proper error handling

**Testing**:
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical workflows

**Performance**:
- Database queries optimized (use EXPLAIN)
- Caching strategy appropriate
- No N+1 query problems

**Security**:
- Input validation
- SQL injection prevention
- Secrets not hardcoded
- OWASP Top 10 considerations

---

## Documentation Standards

### Service README Template

```markdown
# [Service Name] Domain

## Purpose
Brief description of this domain's responsibility

## Tech Stack
- Framework: NestJS / Spring Boot
- Database: PostgreSQL / TimescaleDB
- Cache: Redis
- Message Queue: Kafka

## API Endpoints

### Public APIs
`GET /api/v1/resource` - Description

### Internal APIs (gRPC)
`service.method()` - Description

## Event Bus

### Published Events
- `domain.event-name` - When published, who subscribes

### Subscribed Events
- `other-domain.event-name` - How we handle it

## Environment Variables
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Local Development
```bash
pnpm install
pnpm dev
```

## Testing
```bash
pnpm test          # Unit tests
pnpm test:e2e      # Integration tests
pnpm test:cov      # Coverage report
```

## Deployment
Deployed via Kubernetes in `infrastructure/kubernetes/apps/[domain]/`
```

---

## CODEOWNERS File

```
# Default owners for everything
* @volteryde/core-team

# Infrastructure
/infrastructure/ @volteryde/devops-team

# Java domains
/services/authentication-domain/ @volteryde/backend-java-team
/services/payment-domain/ @volteryde/backend-java-team

# NestJS domains
/services/telematics-domain/ @volteryde/backend-nodejs-team
/services/fleet-operations-domain/ @volteryde/backend-nodejs-team
/services/booking-domain/ @volteryde/backend-nodejs-team
/services/charging-domain/ @volteryde/backend-nodejs-team

# Frontend
/apps/ @volteryde/frontend-team

# Documentation
/docs/ @volteryde/tech-writers

# CI/CD
/.github/workflows/ @volteryde/devops-team
```

---

## Commit Message Convention

### Format (Conventional Commits)
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Add or update tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples
```bash
feat(booking): add Temporal workflow for ride booking

Implement durable booking workflow with automatic retry
and compensation logic for payment failures.

Closes VLT-123

---

fix(payment): resolve race condition in wallet credit

Add distributed lock using Redis to prevent duplicate
wallet credits during concurrent top-up requests.

Fixes VLT-456

---

docs(api): update booking API OpenAPI specification

Add missing endpoints for seat selection and cancellation.
```

---

## Automated Linting and Formatting

### Pre-commit Hook (Husky + lint-staged)

**`.husky/pre-commit`**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
```

**`package.json`**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ],
    "*.{java}": [
      "google-java-format --replace"
    ],
    "*.{json,md,yaml,yml}": [
      "prettier --write"
    ]
  }
}
```

### ESLint Configuration (NestJS services)
**`.eslintrc.js`**:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'warn',
  },
};
```

---

## Workspace Management (pnpm)

**`pnpm-workspace.yaml`**:
```yaml
packages:
  - 'services/*'
  - 'apps/*'
  - 'infrastructure/temporal-workers/*'
```

**Benefits**:
- Shared dependencies across services
- Faster installs with content-addressable store
- Strict dependency isolation

**Commands**:
```bash
# Install all dependencies
pnpm install

# Run script in specific service
pnpm --filter telematics-domain dev

# Run script in all services
pnpm -r dev

# Add dependency to specific service
pnpm --filter booking-domain add @temporal/client
```

---

## Changelog Management

**Automated with `standard-version`**:
```bash
# Bump version and generate CHANGELOG.md
pnpm standard-version

# Preview changes
pnpm standard-version --dry-run

# First release
pnpm standard-version --first-release
```

**CHANGELOG.md** format:
```markdown
# Changelog

## [1.2.0] - 2025-11-15

### Features
- **booking**: Temporal workflow for bookings (VLT-123)
- **payment**: Refund workflow with human-in-the-loop (VLT-145)

### Bug Fixes
- **fleet**: Fix maintenance scheduling race condition (VLT-167)

### Breaking Changes
- **api**: Booking API v1 deprecated, use v2 (VLT-189)

## [1.1.0] - 2025-10-20
...
```

---

## Security Best Practices

### 1. Secrets Management

**❌ NEVER commit secrets to the repository**

**✅ Use AWS Secrets Manager** for all sensitive data:
```bash
# Store secret
aws secretsmanager create-secret \
  --name volteryde/dev/database/password \
  --secret-string "super_secure_password_here"

# Retrieve in application
const secret = await secretsManager.getSecretValue({ 
  SecretId: 'volteryde/dev/database/password' 
}).promise();
```

**Environment Variables**:
- `.env.example` - Template (committed)
- `.env` - Actual values (gitignored)
- Use separate `.env.dev`, `.env.staging`, `.env.production`

### 2. Authentication & Authorization

**Spring Boot (Java) - volteryde-springboot**:
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) {
        http
            .csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .and()
            .authorizeHttpRequests()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
            .and()
            .oauth2ResourceServer().jwt();
        
        return http.build();
    }
}
```

**NestJS - volteryde-nest**:
```typescript
// Global authentication guard
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

// Role-based access control
@Controller('fleet')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FleetController {
  @Get()
  @Roles('FLEET_MANAGER', 'ADMIN')
  findAll() {
    return this.fleetService.findAll();
  }
}
```

### 3. API Security

**Rate Limiting**:
```typescript
// NestJS
@Injectable()
export class RateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rate-limit:${request.ip}`;
    
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    
    if (count > 100) { // 100 requests per minute
      throw new ThrottlerException();
    }
    
    return true;
  }
}
```

**CORS Configuration**:
```typescript
// volteryde-nest/src/main.ts
app.enableCors({
  origin: [
    'https://volteryde.com',
    'https://admin.volteryde.com',
    'https://fleet.volteryde.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 4. Input Validation

**NestJS with class-validator**:
```typescript
export class CreateBookingDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  busId: string;

  @IsNumber()
  @Min(0)
  @Max(10000)
  fare: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  specialRequests?: string;
}

@Controller('bookings')
export class BookingsController {
  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }
}
```

**Spring Boot Validation**:
```java
@PostMapping("/api/payments")
public ResponseEntity<?> createPayment(
    @Valid @RequestBody PaymentRequest request) {
    // Request is automatically validated
    return ResponseEntity.ok(paymentService.process(request));
}

public class PaymentRequest {
    @NotNull
    @Min(100) // Minimum 100 cents
    @Max(1000000)
    private Long amount;
    
    @NotBlank
    @Size(min = 10, max = 100)
    private String transactionId;
    
    @Email
    private String customerEmail;
}
```

### 5. SQL Injection Prevention

**Always use parameterized queries**:

```typescript
// ✅ GOOD - Parameterized query
const user = await this.repository.findOne({
  where: { email: userEmail },
});

// ❌ BAD - String interpolation
const query = `SELECT * FROM users WHERE email = '${userEmail}'`;
```

```java
// ✅ GOOD - JPA Repository
@Query("SELECT u FROM User u WHERE u.email = :email")
User findByEmail(@Param("email") String email);

// ❌ BAD - Native query with concatenation
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
```

### 6. Dependency Security Scanning

**Automated scanning in CI/CD**:

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * *' # Daily
  push:
    branches: [main, develop]

jobs:
  snyk-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run npm audit
        run: pnpm audit --audit-level=moderate

  trivy-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
```

### 7. Container Security

**Multi-stage Dockerfile with non-root user**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

USER nestjs
EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 8. Kubernetes Security

**Network Policies**:
```yaml
# Allow only API Gateway to call backend services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-ingress-policy
  namespace: volteryde-prod
spec:
  podSelector:
    matchLabels:
      tier: backend
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
    ports:
    - protocol: TCP
      port: 3000
```

**Pod Security Standards**:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: volteryde-nest
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: volteryde/nest:latest
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
      readOnlyRootFilesystem: true
```

### 9. Audit Logging

**Log all security-relevant events**:

```typescript
@Injectable()
export class AuditLogger {
  async logAuthAttempt(userId: string, success: boolean, ip: string) {
    await this.auditLog.create({
      eventType: 'AUTH_ATTEMPT',
      userId,
      success,
      ipAddress: ip,
      timestamp: new Date(),
      userAgent: request.headers['user-agent'],
    });
  }

  async logDataAccess(userId: string, resource: string, action: string) {
    await this.auditLog.create({
      eventType: 'DATA_ACCESS',
      userId,
      resource,
      action,
      timestamp: new Date(),
    });
  }
}
```

### 10. Secrets in CI/CD

**GitHub Actions Secrets**:
- ✅ Store in GitHub repository settings → Secrets
- ✅ Use environment-specific secrets
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use OIDC for AWS authentication (no long-lived credentials)

**AWS OIDC Configuration**:
```yaml
# .github/workflows/deploy-production.yml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::ACCOUNT_ID:role/GitHubActions
          aws-region: us-east-1
```

---

## Security Checklist

### Development
- [ ] No secrets in `.env` files committed
- [ ] All secrets stored in AWS Secrets Manager
- [ ] Input validation on all endpoints
- [ ] Parameterized database queries only
- [ ] CSRF protection enabled
- [ ] CORS properly configured

### Code Review
- [ ] No hardcoded credentials
- [ ] No sensitive data in logs
- [ ] Authentication required for protected routes
- [ ] Authorization checks implemented
- [ ] Rate limiting configured
- [ ] SQL injection vulnerabilities checked

### Deployment
- [ ] Containers run as non-root user
- [ ] Network policies defined
- [ ] Pod security standards enforced
- [ ] Secrets encrypted at rest (AWS KMS)
- [ ] TLS/SSL certificates valid
- [ ] WAF rules configured (CloudFront)

### Monitoring
- [ ] Failed login attempts logged
- [ ] Suspicious activity alerts configured
- [ ] Audit logs retained for 90+ days
- [ ] Regular security scans scheduled
- [ ] Dependency vulnerabilities monitored

---

## Summary

✅ **Monorepo** with technology-grouped services (volteryde-springboot, volteryde-nest)  
✅ **6 Frontend Applications** (2 mobile + 4 web portals)  
✅ **GitFlow** branching strategy  
✅ **Automated linting** with Husky + lint-staged  
✅ **Pull request templates** for consistency  
✅ **CODEOWNERS** for automatic reviewer assignment  
✅ **Conventional commits** for clear history  
✅ **pnpm workspaces** for dependency management  
✅ **Automated changelog** generation  
✅ **Comprehensive security** - authentication, authorization, encryption, audit logging

**Next**: See `INFRASTRUCTURE_GUIDE.md` for AWS and Terraform setup
