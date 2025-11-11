# Volteryde Platform - Monorepo

Production-grade electric mobility platform using AWS EKS, RDS PostgreSQL, ElastiCache Redis, S3, CloudFront.

## 🏗️ Architecture

**Backend Services:**
- `services/volteryde-springboot` - Java Spring Boot (Authentication + Payments)
- `services/volteryde-nest` - NestJS (Telematics + Booking + Fleet + Charging)

**Workers:**
- `workers/temporal-workers` - TypeScript workflow orchestration

**Frontend Applications (9 Apps):**

### Mobile (React Native)
- `apps/mobile-passenger-app` - Passenger booking and ride tracking
- `apps/mobile-driver-app` - Driver operations and navigation

### Web (React)
- `apps/web-admin-dashboard` - Super admin platform management
- `apps/web-fleet-manager-portal` - Fleet operator vehicle management
- `apps/web-customer-portal` - Customer web booking interface
- `apps/web-driver-portal` - Driver registration, earnings, documents
- `apps/web-support-dashboard` - Customer support team interface
- `apps/web-corporate-portal` - Corporate/B2B accounts management
- `apps/web-station-manager-app` - Charging station operators

**Shared Libraries:**
- `packages/shared-types` - TypeScript type definitions
- `packages/ui-components` - Shared UI components
- `packages/auth-sdk` - Authentication SDK
- `packages/utils` - Common utilities

**Infrastructure:**
- `infrastructure/terraform` - AWS infrastructure as code
- `infrastructure/kubernetes` - Kubernetes manifests

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Java 17+ (for Spring Boot services)
- Docker >= 24.0
- Terraform >= 1.5.0
- kubectl >= 1.27

### Installation

```bash
# Install dependencies
pnpm install

# Run all services in development mode
pnpm dev

# Build all services
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Local Development

```bash
# Run specific service
pnpm --filter volteryde-nest dev

# Run specific app
pnpm --filter mobile-passenger-app dev

# Add dependency to specific workspace
pnpm --filter temporal-workers add @temporal/client
```

## 📁 Project Structure

```
volteryde-platform/
├── services/
│   ├── volteryde-springboot/    # Java backend (Auth + Payments)
│   └── volteryde-nest/          # NestJS backend (Telematics + Booking + Fleet + Charging)
├── workers/
│   └── temporal-workers/        # TypeScript workflow workers
├── apps/
│   ├── mobile-passenger-app/    # React Native
│   ├── mobile-driver-app/       # React Native
│   ├── web-admin-dashboard/     # React
│   ├── web-fleet-manager-portal/# React
│   ├── web-customer-portal/     # React
│   ├── web-driver-portal/       # React
│   ├── web-support-dashboard/   # React
│   ├── web-corporate-portal/    # React
│   └── web-station-manager-app/ # React
├── packages/                    # Shared libraries/components
├── infrastructure/              # Terraform configs
├── docs/                       # Documentation
├── package.json                # Root package.json with workspaces
├── pnpm-workspace.yaml         # pnpm workspace config
└── README.md
```

## 🔧 Technology Stack

**Backend:**
- Java Spring Boot (Security-critical: Auth & Payments)
- NestJS (Business logic: Telematics, Booking, Fleet, Charging)
- PostgreSQL (Transactional data)
- Redis (Caching & sessions)
- InfluxDB (IoT telemetry)
- Temporal (Workflow orchestration)

**Frontend:**
- React (Web portals)
- React Native (Mobile apps)
- TypeScript
- Tailwind CSS

**Infrastructure:**
- AWS EKS (Kubernetes)
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis
- S3 + CloudFront (CDN)
- Route53 (DNS)
- Secrets Manager
- ALB (Load balancing)

**DevOps:**
- Terraform (Infrastructure as Code)
- Docker (Containerization)
- GitHub Actions (CI/CD)
- Prometheus + Grafana (Monitoring)

## 📚 Documentation

See the `docs/` directory for detailed documentation:

- `docs/architecture/` - Architecture Decision Records (ADRs)
- `docs/api/` - API documentation (OpenAPI specs)
- `docs/guides/` - Developer guides
- `docs/runbooks/` - Operational runbooks

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific workspace
pnpm --filter volteryde-nest test

# Run tests with coverage
pnpm test:cov
```

## 🔐 Security

- All secrets stored in AWS Secrets Manager
- Environment variables loaded from `.env` files (gitignored)
- Use `.env.example` as template

## 🚢 Deployment

```bash
# Deploy to development
cd infrastructure/terraform/environments/dev
terraform init
terraform plan
terraform apply

# Deploy services to Kubernetes
cd ../../../kubernetes
kubectl apply -k overlays/dev
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## 📄 License

MIT

## 🆘 Support

For issues and questions, please open an issue on GitHub or contact the team.

---

**Built with ❤️ by the Volteryde Team**
