# ============================================================================
# Volteryde Java Spring Boot - Multi-stage Docker Build
# ============================================================================

# Stage 1: Builder
FROM maven:3.9-amazoncorretto-17-alpine AS builder

WORKDIR /app

# 1. Copy POMs for dependency caching
# We copy them individually to ensure we duplicate the structure
COPY services/volteryde-springboot/pom.xml .
COPY services/volteryde-springboot/shared-library/pom.xml shared-library/
COPY services/volteryde-springboot/api-gateway/pom.xml api-gateway/
COPY services/volteryde-springboot/service-discovery/pom.xml service-discovery/
COPY services/volteryde-springboot/auth-service/pom.xml auth-service/
COPY services/volteryde-springboot/user-management-service/pom.xml user-management-service/
COPY services/volteryde-springboot/payment-service/pom.xml payment-service/

# 2. Download dependencies (Cached Layer)
# dependency:go-offline can sometimes be flaky with large reactors, 
# 'verify clean --fail-never' or just installing specific deps is sometimes safer,
# but go-offline is the standard optimization.
# Attempt to download external dependencies, ignoring failures for missing internal modules (shared-library)
RUN mvn dependency:resolve dependency:resolve-plugins -B --fail-never

# 3. Copy source code (Frequent Changes)
COPY services/volteryde-springboot/ .

# 4. Build
RUN mvn clean package -DskipTests > build.log 2>&1 || (cat build.log && exit 1)

# Stage 2: Production
FROM bellsoft/liberica-openjre-alpine:17 AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S spring && \
  adduser -S spring -u 1001

ARG SERVICE_NAME
# Ensure we copy from the specific submodule's target
COPY --from=builder /app/${SERVICE_NAME}/target/*.jar app.jar

USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
