# Volteryde Spring Boot Microservices

Microservices architecture for the Volteryde electric mobility platform with Spring Boot.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │───▶│   API Gateway   │───▶│ Service Discovery│
│                 │    │   (Port 8080)   │    │   (Port 8761)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    │         │         │
            ┌───────▼───┐ ┌───▼───┐ ┌──▼──────┐
            │Auth Service│ │Payment│ │User Mgmt│
            │ (Port 8081)│ │Service│ │Service  │
            │            │ │(8082) │ │ (8083)  │
            └────────────┘ └───────┘ └─────────┘
```

## Services

### 🚪 API Gateway (Port 8080)
- **Technology**: Spring Cloud Gateway
- **Purpose**: Single entry point, routing, load balancing
- **Features**: JWT validation, service discovery integration

### 🔍 Service Discovery (Port 8761)
- **Technology**: Eureka Server
- **Purpose**: Service registration and discovery
- **Dashboard**: http://localhost:8761

### 🔐 Authentication Service (Port 8081)
- **Features**: JWT authentication, user management, RBAC
- **Database**: PostgreSQL (volteryde_auth)
- **Endpoints**: `/api/auth/**`

### 💳 Payment Service (Port 8082)
- **Features**: Paystack integration, wallet management, transactions
- **Database**: PostgreSQL (volteryde_payment)
- **Endpoints**: `/api/payment/**`

### 👥 User Management Service (Port 8083)
- **Features**: User profiles, preferences, settings
- **Database**: PostgreSQL (volteryde_user_management)
- **Endpoints**: `/api/user-management/**`

### 📦 Shared Library
- **Purpose**: Common DTOs, utilities, exception handling
- **Components**: JWT utilities, validation, error handling

## Module Structure

```
volteryde-springboot/
├── 📁 api-gateway/                    # Spring Cloud Gateway
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/volteryde/gateway/
│   │   │   │   ├── 📄 GatewayApplication.java
│   │   │   │   ├── 📁 config/
│   │   │   │   └── 📁 filters/
│   │   │   └── 📁 resources/
│   │   │       └── 📄 application.yml
│   ├── 📄 pom.xml
│   └── 📄 Dockerfile
│
├── 📁 service-discovery/              # Eureka Server
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/volteryde/eureka/
│   │   │   │   └── 📄 EurekaServerApplication.java
│   │   │   └── 📁 resources/
│   │   │       └── 📄 application.yml
│   ├── 📄 pom.xml
│   └── 📄 Dockerfile
│
├── 📁 auth-service/                    # Authentication Service
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/volteryde/auth/
│   │   │   │   ├── 📄 AuthServiceApplication.java
│   │   │   │   ├── 📁 controller/
│   │   │   │   ├── 📁 service/
│   │   │   │   ├── 📁 repository/
│   │   │   │   ├── 📁 entity/
│   │   │   │   └── 📁 config/
│   │   │   └── 📁 resources/
│   │   │       └── 📄 application.yml
│   ├── 📄 pom.xml
│   └── 📄 Dockerfile
│
├── 📁 payment-service/                 # Payment Processing
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/volteryde/payment/
│   │   │   │   ├── 📄 PaymentServiceApplication.java
│   │   │   │   ├── 📁 controller/
│   │   │   │   ├── 📁 service/
│   │   │   │   ├── 📁 repository/
│   │   │   │   ├── 📁 entity/
│   │   │   │   └── 📁 config/
│   │   │   └── 📁 resources/
│   │   │       └── 📄 application.yml
│   ├── 📄 pom.xml
│   └── 📄 Dockerfile
│
├── 📁 user-management-service/         # User Management
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/volteryde/usermanagement/
│   │   │   │   ├── 📄 UserManagementServiceApplication.java
│   │   │   │   ├── 📁 controller/
│   │   │   │   ├── 📁 service/
│   │   │   │   ├── 📁 repository/
│   │   │   │   ├── 📁 entity/
│   │   │   │   └── 📁 config/
│   │   │   └── 📁 resources/
│   │   │       └── 📄 application.yml
│   ├── 📄 pom.xml
│   └── 📄 Dockerfile
│
├── 📁 shared-library/                  # Common Components
│   ├── 📁 src/
│   │   └── 📁 main/
│   │       └── 📁 java/com/volteryde/shared/
│   │           ├── 📁 dto/
│   │           │   ├── 📄 UserDto.java
│   │           │   └── 📄 AuthResponse.java
│   │           ├── 📁 utils/
│   │           │   └── 📄 JwtUtil.java
│   │           └── 📁 exceptions/
│   │               └── 📄 GlobalExceptionHandler.java
│   └── 📄 pom.xml
│
├── 📄 pom.xml                          # Parent POM (Multi-module)
├── 📄 docker-compose.yml               # Docker Orchestration
├── 📄 README.md                        # Documentation
└── 📄 .dockerignore                    # Docker ignore file
```

### Module Dependencies

```
┌─────────────────┐    ┌─────────────────┐
│   api-gateway   │───▶│ shared-library  │
└─────────────────┘    └─────────────────┘
         │
┌────────▼────────┐
│ auth-service    │───▶│ shared-library  │
└─────────────────┘    └─────────────────┘
         │
┌────────▼────────┐
│ payment-service │───▶│ shared-library  │
└─────────────────┘    └─────────────────┘
         │
┌────────▼────────┐
│user-management  │───▶│ shared-library  │
│    service      │    └─────────────────┘
└─────────────────┘
```

### Key Design Patterns

- **🏗️ Multi-Module Maven**: Parent POM manages all modules
- **🔄 Shared Library**: Common code reused across services
- **🌐 Service Discovery**: Eureka for dynamic service location
- **🚪 API Gateway**: Centralized entry point and routing
- **🐳 Container Ready**: Each service has its own Dockerfile

## Tech Stack

- **Framework**: Spring Boot 3.2, Spring Cloud 2023.0.0
- **Security**: Spring Security, JWT
- **Database**: PostgreSQL 15+
- **Service Discovery**: Eureka
- **API Gateway**: Spring Cloud Gateway
- **Caching**: Redis
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+
- Docker & Docker Compose
- PostgreSQL 15+ (for local development)

### Quick Start with Docker Compose

```bash
# Build all services
mvn clean install

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Service Development

```bash
# Start Service Discovery first
cd service-discovery
mvn spring-boot:run

# Start other services in separate terminals
cd ../api-gateway && mvn spring-boot:run
cd ../auth-service && mvn spring-boot:run
cd ../payment-service && mvn spring-boot:run
cd ../user-management-service && mvn spring-boot:run
```

### Environment Variables

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=volteryde
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400000

# Payment
PAYSTACK_SECRET_KEY=your-paystack-secret-key

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## API Documentation

### Gateway Routes
- **Auth**: `http://localhost:8080/api/v1/auth/**` → Auth Service
- **Payment**: `http://localhost:8080/api/v1/payments/**` → Payment Service  
- **Users**: `http://localhost:8080/api/v1/users/**` → User Management Service

### Service Health Checks
- **Gateway**: http://localhost:8080/actuator/health
- **Eureka Dashboard**: http://localhost:8761
- **Auth Service**: http://localhost:8081/actuator/health
- **Payment Service**: http://localhost:8082/actuator/health
- **User Service**: http://localhost:8083/actuator/health

## Testing

```bash
# Run all tests
mvn test

# Run tests with coverage
mvn test jacoco:report

# Run tests for specific service
cd auth-service && mvn test
cd payment-service && mvn test
cd user-management-service && mvn test
```

## Development Workflow

1. **Start Infrastructure**: `docker-compose up -d postgres redis`
2. **Start Service Discovery**: `cd service-discovery && mvn spring-boot:run`
3. **Start Gateway**: `cd api-gateway && mvn spring-boot:run`
4. **Start Business Services**: Individual services as needed
5. **Test via Gateway**: All requests go through port 8080

## Monitoring & Observability

- **Health Checks**: `/actuator/health` on all services
- **Metrics**: Prometheus endpoints enabled
- **Service Registry**: Eureka dashboard at port 8761
- **Logging**: Structured logging with service identification

## Production Deployment

```bash
# Build production images
mvn clean package
docker build -t volteryde/gateway ./api-gateway
docker build -t volteryde/auth-service ./auth-service
# ... build other services

# Deploy with environment-specific configs
docker-compose -f docker-compose.prod.yml up -d
```

## Security

- All endpoints except `/api/v1/auth/**` require JWT authentication
- Passwords are hashed using BCrypt
- JWT tokens expire after 24 hours
- CORS enabled for configured origins

## Troubleshooting

### Common Issues

**Services not registering with Eureka:**
```bash
# Check Eureka server is running
curl http://localhost:8761

# Verify service configuration
grep -r "eureka" service-name/src/main/resources/
```

**Database connection issues:**
```bash
# Check PostgreSQL container
docker-compose ps postgres
docker-compose logs postgres

# Test database connection
psql -h localhost -U postgres -d volteryde
```

**Port conflicts:**
```bash
# Check what's using ports
netstat -an | grep :8080
netstat -an | grep :8761

# Kill processes if needed
# Windows: taskkill /PID <PID> /F
# Linux/Mac: kill -9 <PID>
```

**Build failures:**
```bash
# Clean build
mvn clean install -DskipTests

# Check Java version
java -version  # Should be 17+

# Check Maven version
mvn --version
```

### Debug Mode

Enable debug logging for any service:
```bash
# Add to application.yml
logging:
  level:
    com.volteryde: DEBUG
    org.springframework.cloud: DEBUG
```

## Monitoring & Metrics

### Prometheus Endpoints
All services expose metrics at `/actuator/prometheus`

### Grafana Dashboard Setup
```bash
# Add to docker-compose.yml for monitoring
grafana:
  image: grafana/grafana:latest
  ports:
    - "3000:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh
services=("gateway:8080" "auth:8081" "payment:8082" "user-management:8083")
for service in "${services[@]}"; do
    name=$(echo $service | cut -d':' -f1)
    port=$(echo $service | cut -d':' -f2)
    if curl -f http://localhost:$port/actuator/health > /dev/null 2>&1; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is unhealthy"
    fi
done
```

## Performance Optimization

### JVM Tuning
Add to `docker-compose.yml` for production:
```yaml
environment:
  - JAVA_OPTS=-Xms512m -Xmx1024m -XX:+UseG1GC
```

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_transaction_status ON transactions(status);
```

### Caching Strategy
```yaml
# Redis configuration in application.yml
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    timeout: 2000ms
```

## CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
      - name: Build with Maven
        run: mvn clean package
      - name: Build Docker images
        run: |
          docker build -t volteryde/gateway ./api-gateway
          docker build -t volteryde/auth-service ./auth-service
```

## Architecture Decision Records (ADRs)

### ADR-001: Microservices Architecture
**Decision**: Adopt microservices architecture over monolithic
**Rationale**: 
- Independent scaling and deployment
- Technology diversity per service
- Fault isolation
- Team autonomy

### ADR-002: Service Discovery with Eureka
**Decision**: Use Eureka for service discovery
**Rationale**:
- Native Spring Cloud integration
- Simple configuration
- Good for medium-scale deployments

### ADR-003: API Gateway Pattern
**Decision**: Implement API Gateway with Spring Cloud Gateway
**Rationale**:
- Centralized routing and security
- Load balancing
- Protocol translation
- Monitoring and logging

## Roadmap

### Phase 1 (Current)
- ✅ Basic microservices setup
- ✅ Service discovery
- ✅ API gateway
- ✅ Docker orchestration

### Phase 2 (Next)
- 🔄 Distributed tracing with Zipkin
- 🔄 Circuit breakers with Hystrix
- 🔄 Centralized logging with ELK stack
- 🔄 Configuration server with Spring Cloud Config

### Phase 3 (Future)
- 📋 Event-driven architecture with Kafka
- 📋 CQRS pattern for complex queries
- 📋 GraphQL API layer
- 📋 Multi-region deployment

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Run tests: `mvn test`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push branch: `git push origin feature/amazing-feature`
6. Submit Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Maintainer**: Volteryde Platform Team
- **Email**: platform@volteryde.com
- **Issues**: [GitHub Issues](https://github.com/volteryde/platform/issues)
