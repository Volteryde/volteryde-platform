# Client Authentication Service

A Spring Boot microservice handling authentication for mobile/external clients (Riders) in the Volteryde platform.

## Features

- **Phone/OTP Authentication**: Primary authentication method with SMS OTP verification
- **Email/Password Authentication**: Alternative authentication method
- **Google OAuth**: Social login with account linking support
- **JWT Token Management**: Access and refresh token generation/validation
- **Password Recovery**: OTP-based password reset flow
- **Terms & Conditions**: Required acceptance during onboarding
- **Rate Limiting**: Protection against abuse
- **Session Management**: Multi-device support with logout capabilities

## Tech Stack

- Java 17+
- Spring Boot 3.x
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT (jjwt)
- Spring Cloud (Eureka, OpenFeign)

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | (development default) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (empty) |
| `DATABASE_URL` | PostgreSQL connection URL | localhost:5432/client_auth_db |

### Application Properties

Key configuration in `application.yml`:

```yaml
server:
  port: 8082

spring:
  security:
    jwt:
      secret: ${JWT_SECRET}
      expiration: 3600000      # 1 hour
      refresh-expiration: 604800000  # 7 days

otp:
  expiration-minutes: 5
  length: 6
```

## Database Setup

1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE client_auth_db;
   ```

2. Run the initialization script:
   ```bash
   psql -U postgres -f database/init.sql
   ```

Or let Hibernate auto-create tables with `ddl-auto: update`.

## Running Locally

### Prerequisites
- Java 17+
- PostgreSQL 14+
- Maven or use included wrapper

### Build and Run

```bash
# From the client-auth-service directory
./mvnw clean install
./mvnw spring-boot:run
```

Or from parent directory:
```bash
./mvnw -pl client-auth-service spring-boot:run
```

### Docker

```bash
docker build -t volteryde/client-auth-service .
docker run -p 8082:8082 \
  -e JWT_SECRET=your-secret \
  -e DATABASE_URL=jdbc:postgresql://host:5432/client_auth_db \
  volteryde/client-auth-service
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete endpoint documentation.

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/client/auth/otp/send` | POST | Send OTP to phone |
| `/client/auth/otp/verify` | POST | Verify OTP |
| `/client/auth/signup/complete` | POST | Complete new user profile |
| `/client/auth/login` | POST | Email/password login |
| `/client/auth/social/google` | POST | Google OAuth login |
| `/client/auth/refresh` | POST | Refresh access token |
| `/client/auth/me` | GET | Get current user |
| `/client/auth/validate` | POST | Validate token (for other services) |

## Architecture

### Authentication Flow

```
Phone → OTP → [Existing User] → Tokens → App
              [New User] → Profile Setup → Terms → Tokens → App
```

### Key Components

- **Controller**: REST endpoints in `ClientAuthController`
- **Service**: Business logic in `ClientAuthService`
- **JWT Service**: Token generation/validation in `ClientJwtService`
- **OTP Service**: OTP generation/verification in `OtpService`
- **Rate Limiter**: Request throttling in `RateLimiterService`

### Entity Model

- `ClientUser`: User account information
- `ClientRefreshToken`: Session tokens
- `Otp`: One-time passwords
- `PasswordResetToken`: Password reset tokens
- `TermsAcceptance`: Terms acceptance audit log

## Security Considerations

1. **Terms Acceptance**: New users MUST accept terms before account creation
2. **Rate Limiting**: OTP and password reset endpoints are rate-limited
3. **Token Validation**: Strict JWT validation with issuer check
4. **Password Security**: BCrypt hashing for passwords
5. **Audit Trail**: Terms acceptance is logged with timestamp, IP, and device info

## Integration

### For Client-App

The service is designed to work with the React Native/Expo Client-App:

```typescript
const CLIENT_AUTH_BASE_URL = 'http://localhost:8082';

// Send OTP
await fetch(`${CLIENT_AUTH_BASE_URL}/client/auth/otp/send`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone }),
});
```

### For Other Microservices

Validate client tokens using the validate endpoint:

```java
// Example: Validate token in another service
ResponseEntity<TokenValidationResponse> response = restTemplate.exchange(
    "http://client-auth-service/client/auth/validate",
    HttpMethod.POST,
    new HttpEntity<>(headers),
    TokenValidationResponse.class
);
```

## Separation from Internal Auth

This service is **ONLY** for mobile/external clients (Riders). Internal authentication for:
- Drivers
- Dispatchers  
- Admins
- BI Partners

...is handled by the separate `auth-service` microservice.

## Health Check

```bash
curl http://localhost:8082/actuator/health
```

## License

Proprietary - Volteryde © 2026
