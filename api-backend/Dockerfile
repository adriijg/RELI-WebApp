FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
# Contexto de build: raiz del repo (ver docker-compose.yml)
COPY api-backend/mvnw .
COPY api-backend/.mvn ./.mvn
COPY api-backend/pom.xml .
COPY api-backend/src ./src
RUN ./mvnw package -DskipTests -q

FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app
# Python para los scripts FFM que el backend invoca con ProcessBuilder ("python scripts/ffmadrid_acta_import.py").
# En Alpine solo existe "python3": se crea el enlace "python". Solo se necesita "requests" (ver scripts/requirements.txt).
RUN apk add --no-cache python3 py3-requests && ln -sf /usr/bin/python3 /usr/bin/python
COPY --from=build /app/target/*.jar app.jar
COPY scripts ./scripts
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
