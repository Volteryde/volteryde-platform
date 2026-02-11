# # syntax=docker/dockerfile:1.4
# ============================================================================
# Volteryde Java Spring Boot - Multi-stage Docker Build
# ============================================================================
# Uses BuildKit cache mounts for faster Maven builds

# Stage 1: Builder
FROM maven:3.9-amazoncorretto-17-alpine AS builder

WORKDIR /app

# Configure Maven for faster builds
ENV MAVEN_OPTS="-Xmx512m -XX:+UseContainerSupport"

# 1. Copy POMs for dependency caching
COPY services/volteryde-springboot/pom.xml .
COPY services/volteryde-springboot/shared-library/pom.xml shared-library/
COPY services/volteryde-springboot/api-gateway/pom.xml api-gateway/
COPY services/volteryde-springboot/service-discovery/pom.xml service-discovery/
COPY services/volteryde-springboot/auth-service/pom.xml auth-service/
COPY services/volteryde-springboot/user-management-service/pom.xml user-management-service/
COPY services/volteryde-springboot/client-auth-service/pom.xml client-auth-service/
COPY services/volteryde-springboot/payment-service/pom.xml payment-service/

# 2. Download dependencies with BuildKit cache mount
# This caches Maven dependencies between builds
RUN --mount=type=cache,target=/root/.m2/repository \
  mvn dependency:resolve dependency:resolve-plugins -B --fail-never || true

# 3. Copy source code
COPY services/volteryde-springboot/ .

# 4. Build with cache mount and retry logic
RUN --mount=type=cache,target=/root/.m2/repository \
  mvn clean package -DskipTests -B -q \
  || mvn clean package -DskipTests -B -q \
  || (mvn clean package -DskipTests -B && echo "Build successful")

# Stage 2: Production
FROM bellsoft/liberica-openjre-alpine:17 AS production

WORKDIR /app

RUN apk add --no-cache dumb-init wget

RUN addgroup -g 1001 -S spring && \
  adduser -S spring -u 1001

ARG SERVICE_NAME
# Copy the built jar
COPY --from=builder /app/${SERVICE_NAME}/target/*.jar app.jar

USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
