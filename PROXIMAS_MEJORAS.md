# Próximas mejoras — RELI-WebApp

Actualizado: 2026-11-16  
Estado: backlog pendiente de implementar  
Base: `develop`

## Prioridad alta

### 0. Autorización de dispositivo en la Federación (Novanet / FFM)

**Problema:** Novanet ha introducido validación de nuevos dispositivos (`error 10005: Dispositivo no confirmado`), impidiendo el login automatizado de sincronización y actas sin autorización previa. El código del backend y scripts ya soporta `deviceid` persistente (`FFM_DEVICE_ID`), pero requiere la aprobación del administrador del club.

**Tareas pendientes:**
- [ ] Autorizar el dispositivo del club:
  - **Opción A (Aprobación admin):** En la intranet de Novanet de la FFM, acceder con el usuario administrador del club a *Colaboradores / Dispositivos* y autorizar la solicitud de "PC-Adri" (`4a5c8120-e71c-4b53-9a3b-21a4f0de74b9`) marcando "Confiar en este dispositivo".
  - **Opción B (Reutilizar cookie existente):** Si ya se inicia sesión habitualmente en `parla.ffmadrid.es` desde otro navegador, copiar el valor de la cookie o localStorage `device_id` y pegarlo en `FFM_DEVICE_ID` de `api-backend/.env` y `nas-deploy/.env`.
- [ ] Probar la sincronización completa (`FfmSyncService` y `scripts/ffmadrid.py`) una vez autorizado.

**Archivos:** `api-backend/.env`, `nas-deploy/.env`, `scripts/ffmadrid.py`, `api-backend/src/main/java/es/adri/demo/service/FfmSyncService.java`.

### 1. Migraciones de base de datos

**Problema:** producción usa `spring.jpa.hibernate.ddl-auto=update`, por lo que Hibernate puede alterar el esquema sin revisión.

**Tareas:**
- [ ] Añadir Flyway (`flyway-core` y soporte PostgreSQL).
- [ ] Crear una migración baseline con el esquema actual.
- [ ] Cambiar producción a `ddl-auto=validate` y mantener H2 con `create-drop` solo en tests.
- [ ] Documentar y probar una restauración de Supabase.

**Archivos:** `api-backend/pom.xml`, `api-backend/src/main/resources/application.properties`, `api-backend/src/main/resources/application-prod.properties`.

**Criterio de aceptación:** la aplicación arranca contra la BD existente con `validate`, las migraciones se aplican en CI/producción y existe un restore probado.

### 2. Sesión JWT y almacenamiento del token

**Problema:** el JWT se guarda en `localStorage` y dura 24 horas. El timeout de 10 minutos es solo del cliente, no invalida el token en el servidor.

**Tareas:**
- [ ] Migrar a cookie `httpOnly`, `Secure` y `SameSite` con protección CSRF.
- [ ] Añadir access token corto + refresh token con rotación.
- [ ] O, como paso intermedio, reducir la expiración y añadir revocación por `tokenVersion`.
- [ ] Invalidar sesión al cambiar contraseña, rol o al hacer logout.
- [ ] Eliminar el mensaje que sugiere que la sesión expira en servidor cuando solo expira en UI.

**Archivos:** `SecurityConfig.java`, `JwtService.java`, `JwtAuthenticationFilter.java`, `UserService.java`, `reli-frontend/src/services/api.js`, `AppContext.jsx`, `AuthModal.jsx`.

**Criterio de aceptación:** el token no es accesible desde JavaScript, el logout lo invalida y un cambio de rol surte efecto sin esperar 24 horas.

### 3. Logs de autenticación con Google

**Problema:** `UserService.java:124` registra parte del ID token y `UserService.java:137` registra email, `sub` y `aud`.

**Tareas:**
- [ ] No registrar la URL de `tokeninfo` ni ningún fragmento del token.
- [ ] Eliminar o enmascarar email/sub en logs.
- [ ] Valorar validar el token con JWKS de Google en lugar de `tokeninfo` por query string.
- [ ] Revisar el resto de logs de autenticación para evitar PII.

**Archivos:** `api-backend/src/main/java/es/adri/demo/service/UserService.java`.

**Criterio de aceptación:** los logs no contienen tokens, emails ni identificadores de Google.

### 4. Node 24 y actualización de GitHub Actions

**Problema:** Node 20 terminó su soporte en abril de 2026. CI, Dockerfile y varias actions siguen usándolo.

**Tareas:**
- [ ] Cambiar CI a Node 24 LTS.
- [ ] Cambiar `node:20-alpine` por `node:24-alpine` en el Dockerfile del frontend.
- [ ] Actualizar `actions/checkout`, `actions/setup-node`, `actions/setup-java@v5` y actions de Docker.
- [ ] Verificar que Vite 8 y el build siguen funcionando.

**Archivos:** `.github/workflows/ci.yml`, `.github/workflows/cd.yml`, `reli-frontend/Dockerfile`.

**Criterio de aceptación:** CI y build de imagen pasan sin avisos de Node 20 ni de actions obsoletas.

### 5. Despliegue inmutable, rollback y smoke test

**Problema:** CD despliega `latest`, no conserva una versión anterior y no valida la producción después del deploy.

**Tareas:**
- [ ] Desplegar el tag SHA que ya genera el build, no `latest`.
- [ ] Guardar el tag anterior y añadir rollback automático si falla el smoke test.
- [ ] Añadir smoke test post-deploy: home 200, API 200, Swagger 404, CORS correcto.
- [ ] Configurar aprobación manual en el environment `production` si no está activa.

**Archivos:** `.github/workflows/cd.yml`, `docker-compose.nas.yml`, `scripts/` (nuevo script de smoke test).

**Criterio de aceptación:** cada deploy queda asociado a un SHA, se puede volver al anterior y un fallo de smoke test revierte el despliegue.

## Prioridad media

### 6. Tests de frontend y E2E

**Problema:** no hay tests de frontend; CI solo ejecuta lint y build.

**Tareas:**
- [ ] Añadir Vitest + Testing Library.
- [ ] Añadir Playwright para login, rutas admin, calendario y detalle de partido.
- [ ] Ejecutar los tests en CI.
- [ ] Añadir un umbral inicial de cobertura y subirlo progresivamente.

**Criterio de aceptación:** los flujos críticos están cubiertos y un fallo de test bloquea el merge.

### 7. Seguridad automatizada en CI

**Problema:** Dependabot ayuda, pero CI no bloquea vulnerabilidades ni analiza imágenes.

**Tareas:**
- [ ] Añadir `npm audit --audit-level=high`.
- [ ] Añadir CodeQL para JavaScript y Java.
- [ ] Escanear las imágenes con Trivy antes de desplegar.
- [ ] Generar SBOM de las imágenes.
- [ ] Bloquear high/critical en PRs.

**Criterio de aceptación:** una dependencia o imagen vulnerable bloquea el pipeline.

### 8. Endurecimiento de Docker

**Problema:** los contenedores corren como root y el backend lleva H2/H2 Console y un JDK completo al runtime.

**Tareas:**
- [ ] Ejecutar backend y frontend como usuario no root.
- [ ] Usar `eclipse-temurin:21-jre-alpine` en el runtime del backend.
- [ ] Sacar H2 y H2 Console del runtime de producción.
- [ ] Fijar imágenes por digest.
- [ ] Valorar separar el scraper Python del contenedor principal.

**Criterio de aceptación:** los contenedores no corren como root, el JAR de producción no incluye H2 y el escaneo de imagen queda limpio.

### 9. Observabilidad y salud

**Problema:** el healthcheck usa `/api/players`, que depende de la BD, y no hay métricas ni alertas.

**Tareas:**
- [ ] Añadir Spring Boot Actuator.
- [ ] Exponer solo `health`, `info` y readiness/liveness.
- [ ] Usar `/actuator/health/readiness` en el healthcheck.
- [ ] Añadir Sentry en frontend y backend.
- [ ] Configurar una alerta externa de caída.

**Criterio de aceptación:** hay healthchecks separados de la lógica de negocio y una caída genera alerta.

### 10. Rendimiento del frontend

**Problema:** el bundle principal sigue en 426 kB (132 kB gzip) y `favicon.png` pesa 636 kB.

**Tareas:**
- [ ] Analizar el bundle con `rollup-plugin-visualizer`.
- [ ] Separar vendors con `manualChunks` (React, router, framer-motion, Supabase).
- [ ] Cargar `AuthModal` y animaciones no críticas bajo demanda.
- [ ] Eliminar `favicon.png` si no se usa y convertir imágenes pesadas a WebP/AVIF.
- [ ] Definir un presupuesto de tamaño para CI.

**Criterio de aceptación:** el bundle principal baja al menos un 20 % y CI avisa si se supera el presupuesto.

## Prioridad baja

### 11. Warnings de ESLint

- [ ] Corregir los 4 warnings de `AuthModal.jsx`, `EmailActionPage.jsx` y `MatchDetail.jsx`.
- [ ] Dejar `npm run lint` sin warnings.

### 12. Endurecer CSP, CORS y rate limiting

- [ ] Quitar `'unsafe-inline'` de `script-src` usando hash/nonce para el JSON-LD.
- [ ] Limitar CORS a producción en el perfil `prod` (sin `localhost`).
- [ ] Añadir rate limit global al API, no solo a login/contacto.

### 13. Accesibilidad y SEO

- [ ] Añadir Lighthouse/axe en CI.
- [ ] Generar sitemap dinámico para noticias y partidos.
- [ ] Revisar contraste, foco y navegación por teclado.

### 14. Entorno local

- [ ] Reiniciar el backend de `8080` desde el IDE para cargar el fix de 404.
- [ ] Documentar el arranque local completo en el README.

## Orden recomendado

1. Migraciones de BD.
2. Sesión JWT.
3. Logs de Google.
4. Node 24 y actions.
5. Deploy inmutable + smoke test.
6. Tests de frontend/E2E.
7. Seguridad automatizada.
8. Docker, observabilidad y rendimiento.
