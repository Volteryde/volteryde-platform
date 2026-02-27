# Build stage
FROM maven:3.9-eclipse-temurin-17 AS builder

LABEL maintainer="Volteryde Platform Team"
LABEL service="payment-service"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Copy parent POM and all module POMs
COPY pom.xml .
COPY shared-library ./shared-library
COPY service-discovery ./service-discovery
COPY api-gateway ./api-gateway
COPY auth-service ./auth-service
COPY client-auth-service ./client-auth-service
COPY user-management-service ./user-management-service

# Copy payment service source
COPY payment-service/pom.xml ./payment-service/
COPY payment-service/src ./payment-service/src

# Build the application (from parent directory)
RUN mvn clean package -DskipTests -pl payment-service -am

# Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy built JAR from builder
COPY --from=builder /app/payment-service/target/payment-service-1.0.0.jar app.jar

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8083/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
