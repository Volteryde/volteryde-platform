# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy parent pom first for dependency caching
COPY pom.xml /app/parent-pom.xml
COPY client-auth-service/pom.xml /app/client-auth-service/pom.xml
COPY shared-library/pom.xml /app/shared-library/pom.xml

# Build shared library first
COPY shared-library /app/shared-library
RUN mvn -f /app/shared-library/pom.xml install -DskipTests

# Copy and build client-auth-service
COPY client-auth-service /app/client-auth-service
RUN mvn -f /app/client-auth-service/pom.xml package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/client-auth-service/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]
