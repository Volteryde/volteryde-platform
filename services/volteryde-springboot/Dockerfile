# ============================================================================
# Volteryde Java Spring Boot - Multi-stage Docker Build
# ============================================================================

# Stage 1: Builder
FROM maven:3.9-amazoncorretto-17-alpine AS builder

WORKDIR /app

COPY services/volteryde-springboot/pom.xml ./
COPY services/volteryde-springboot/src ./src

RUN mvn clean package -DskipTests

# Stage 2: Production
FROM bellsoft/liberica-openjre-alpine:17 AS production

WORKDIR /app

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S spring && \
    adduser -S spring -u 1001

COPY --from=builder /app/target/*.jar app.jar

USER spring

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
