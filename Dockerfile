# ──────────────────────────────────────────────────────────────────
# LifeDrop Backend — Repository Root Multi-Stage Dockerfile (Java 17)
# Enables zero-config Render deployments even when Root Directory is left as default ('.')
# ──────────────────────────────────────────────────────────────────

# Stage 1: Build with Maven and Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY lifedrop/backend/pom.xml .
RUN mvn dependency:resolve -B

# Copy source code and build production jar
COPY lifedrop/backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight runtime image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for container security
RUN addgroup -S lifedrop && adduser -S lifedrop -G lifedrop
USER lifedrop

# Copy executable jar from builder stage
COPY --from=builder /app/target/app.jar app.jar

# Render & Railway supply dynamic $PORT
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Dserver.port=${PORT} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE} -jar app.jar"]
