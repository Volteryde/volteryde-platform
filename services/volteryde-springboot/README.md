# Volteryde Spring Boot Backend

Java Spring Boot service handling Authentication and Payment processing.

## Features

- **Authentication Module**: OAuth2, JWT, user management, RBAC
- **Payment Module**: Paystack integration, wallet management, transaction processing

## Tech Stack

- Spring Boot 3.2
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT (JSON Web Tokens)

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+
- PostgreSQL 15+

### Installation

```bash
mvn clean install
```

### Environment Variables

Set the following environment variables:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=volteryde
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

JWT_SECRET=your-secret-key-here
JWT_ISSUER_URI=http://localhost:8080
```

### Running the service

```bash
# Development
mvn spring-boot:run

# Production
java -jar target/volteryde-springboot-1.0.0.jar
```

### Testing

```bash
# Run tests
mvn test

# Run tests with coverage
mvn test jacoco:report
```

## API Documentation

Once the service is running:
- Base URL: http://localhost:8080/api/v1
- Health Check: http://localhost:8080/api/v1/actuator/health

## Module Structure

```
src/main/java/com/volteryde/
├── authentication/        # Auth, user management, JWT
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   └── config/
├── payment/              # Payment processing, Paystack
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   └── integrations/
└── shared/               # Shared utilities
    ├── config/
    ├── security/
    ├── exceptions/
    └── utils/
```

## Security

- All endpoints except `/api/v1/auth/**` require JWT authentication
- Passwords are hashed using BCrypt
- JWT tokens expire after 24 hours
- CORS enabled for configured origins
