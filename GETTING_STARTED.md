# Getting Started with Volteryde Platform

Welcome to the Volteryde Platform monorepo! This guide will help you set up your development environment.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Java** 17+ (for Spring Boot services)
- **Maven** 3.8+
- **Docker** >= 24.0
- **Docker Compose** >= 2.0
- **PostgreSQL** 15+ (or use Docker Compose)
- **Redis** 7+ (or use Docker Compose)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
cd /Users/kaeytee/Desktop/CODES/Volteryde/volteryde-platform
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies for all workspaces
pnpm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your local settings
# For local development, the defaults should work with Docker Compose
```

### 4. Start Infrastructure Services

Start PostgreSQL, Redis, and Temporal using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- Temporal Server on `localhost:7233`
- Temporal UI on `http://localhost:8080`

Verify services are running:

```bash
docker-compose ps
```

### 5. Start Backend Services

#### NestJS Service (Telematics, Booking, Fleet, Charging)

```bash
# Navigate to the service
cd services/volteryde-nest

# Install dependencies (if not done)
pnpm install

# Run in development mode
pnpm dev
```

The NestJS service will be available at:
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs

#### Java Spring Boot Service (Auth, Payments)

```bash
# Navigate to the service
cd services/volteryde-springboot

# Build and run
mvn spring-boot:run
```

The Spring Boot service will be available at:
- API: http://localhost:8080/api/v1
- Health Check: http://localhost:8080/api/v1/actuator/health

### 6. Start Temporal Workers

```bash
cd workers/temporal-workers
pnpm install
pnpm dev
```

### 7. Verify Everything is Running

Check that all services are accessible:

```bash
# Check NestJS
curl http://localhost:3000/api/v1

# Check Spring Boot
curl http://localhost:8080/api/v1/actuator/health

# Check Temporal UI
open http://localhost:8080
```

## 📁 Project Structure Overview

```
volteryde-platform/
├── services/
│   ├── volteryde-springboot/    # Java backend (Auth + Payments)
│   └── volteryde-nest/          # NestJS backend (Telematics + Booking + Fleet + Charging)
├── workers/
│   └── temporal-workers/        # TypeScript workflow workers
├── apps/
│   ├── mobile-passenger-app/    # React Native - Passenger app
│   ├── mobile-driver-app/       # React Native - Driver app
│   ├── web-admin-dashboard/     # React - Admin panel
│   ├── web-fleet-manager-portal/# React - Fleet management
│   ├── web-customer-portal/     # React - Customer booking
│   ├── web-driver-portal/       # React - Driver portal
│   ├── web-support-dashboard/   # React - Support team
│   ├── web-corporate-portal/    # React - B2B accounts
│   └── web-station-manager-app/ # React - Charging stations
├── packages/                    # Shared libraries
│   ├── shared-types/
│   ├── ui-components/
│   ├── auth-sdk/
│   └── utils/
├── infrastructure/              # Terraform & Kubernetes configs
│   ├── terraform/
│   └── kubernetes/
└── docs/                       # Documentation
```

## 🛠️ Development Workflow

### Running Specific Services

```bash
# Run specific service
pnpm --filter volteryde-nest dev
pnpm --filter temporal-workers dev

# Run specific app
pnpm --filter mobile-passenger-app dev
```

### Building Services

```bash
# Build all services
pnpm build

# Build specific service
pnpm --filter volteryde-nest build
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm --filter volteryde-nest test

# Run with coverage
pnpm --filter volteryde-nest test:cov
```

### Code Quality

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check
pnpm typecheck
```

## 🗄️ Database Management

### Accessing PostgreSQL

```bash
# Using Docker
docker exec -it volteryde-postgres psql -U postgres -d volteryde

# Or using local psql
psql -h localhost -U postgres -d volteryde
```

### Running Migrations

(To be implemented with TypeORM migrations)

```bash
# Generate migration
pnpm --filter volteryde-nest migration:generate

# Run migrations
pnpm --filter volteryde-nest migration:run
```

## 🔐 Environment Configuration

### Development

Use `.env` file with default values from `.env.example`

### Staging/Production

Use AWS Secrets Manager:
- Database credentials
- API keys
- JWT secrets

## 📚 Next Steps

1. **Read the Architecture Docs**: See `docs/architecture/` for system design
2. **API Documentation**: Check Swagger UI at http://localhost:3000/api/docs
3. **Temporal Workflows**: Visit Temporal UI at http://localhost:8080
4. **Infrastructure Setup**: See `infrastructure/README.md` for AWS deployment

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :8080

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### pnpm Install Fails

```bash
# Clear cache
pnpm store prune

# Clean and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `pnpm test`
4. Commit: `git commit -m "feat: your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## 📞 Support

For questions and support:
- Check the `docs/` directory
- Open an issue on GitHub
- Contact the team on Slack

---

**Happy coding! 🚀**
