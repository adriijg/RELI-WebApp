# Changelog — Real Lisiados WebApp

Todos los cambios notables de este proyecto están documentados en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

El esquema de versiones sigue el patrón `1.MM.DD` (Versión 1, mes y día de lanzamiento):

---

## [1.11.16] — 2026-11-16

### 🛡️ Protección de datos manuales
- **Blindaje de partidos manuales (`manual = true`):**
  - Añadido el campo `manual` a las entidades `Match` y `NeutralMatch` y a sus respectivos DTOs.
  - Al crear o editar un partido desde el panel de administración, se marca automáticamente como `manual = true`.
  - La sincronización automática y manual de FFM (`FfmSyncService`) respeta íntegramente los partidos marcados como manuales y **nunca sobrescribe** sus fechas, horarios, sedes o marcadores.
  - Añadido toggle visual e indicador de estado "Manual" en las vistas de administración [MatchesAdmin.jsx](file:///e:/Proyectos/RELI-WebApp/reli-frontend/src/pages/admin/MatchesAdmin.jsx) y [GroupMatchesAdmin.jsx](file:///e:/Proyectos/RELI-WebApp/reli-frontend/src/pages/admin/GroupMatchesAdmin.jsx).

### ⚽ Scraping y actas (FFMadrid / Novanet)
- **Corrección de marcadores cruzados:**
  - Se aisló la extracción de resultados bloque a bloque (`portlet-body body_fed` / `<!--loop de partidos`) en [FfmSyncService.java](file:///e:/Proyectos/RELI-WebApp/api-backend/src/main/java/es/adri/demo/service/FfmSyncService.java) y [scripts/ffmadrid.py](file:///e:/Proyectos/RELI-WebApp/scripts/ffmadrid.py). Evita que un partido sin resultado tome el marcador del siguiente partido de la jornada.
  - Añadido test unitario de regresión (`parseJornadaDoesNotStealScoreFromNextMatch`).
- **Importación segura de actas:**
  - En [scripts/ffmadrid_acta_import.py](file:///e:/Proyectos/RELI-WebApp/scripts/ffmadrid_acta_import.py), se filtra exclusivamente la plantilla del Real Lisiados (código `1000128`), ignorando al rival y casando a los jugadores por nombre y apellidos normalizados.
  - Se preservan las asistencias y los MVPs introducidos manualmente al reimportar el acta federativa.
- **Soporte para verificación de dispositivo (error 10005 Novanet):**
  - Adaptados `FfmSyncService.java`, `FfmActaService.java` y `scripts/ffmadrid.py` para soportar `deviceid` persistente (`FFM_DEVICE_ID`), permitiendo autenticar con dispositivos de confianza del club.

### 📧 Correos y notificaciones (Gmail SMTP)
- **Corrección de credenciales SMTP en despliegue:**
  - Sincronizada la contraseña de aplicación de Gmail (16 caracteres) en `nas-deploy/.env` para evitar caídas de autenticación (`BadCredentials`) en el NAS.
- **Timeouts de conexión SMTP:**
  - Añadidos timeouts de 5000 ms (`connectiontimeout`, `timeout`, `writetimeout`) en [application.properties](file:///e:/Proyectos/RELI-WebApp/api-backend/src/main/resources/application.properties) para evitar hilos bloqueados ante caídas o lentitud de red.
- **Diagnóstico mejorado en panel admin:**
  - En [AdminEmailController.java](file:///e:/Proyectos/RELI-WebApp/api-backend/src/main/java/es/adri/demo/controller/AdminEmailController.java), los endpoints de prueba de correo devuelven el detalle exacto del servidor SMTP (HTTP 502) en lugar de un error interno genérico.

### 💻 Entorno y compilación
- **Soporte en IDEs y null analysis:**
  - Desactivado el análisis estricto de nulos en `.vscode/settings.json` (`"java.compile.nullAnalysis.mode": "disabled"`).
  - Añadidos constructores canónicos explícitos en `Match`, `MatchDTO`, `MatchRequestDTO` y `NeutralMatchDTO` para eliminar cualquier ambigüedad en Eclipse/VS Code.
- **Verificación completa:**
  - Backend: 64 de 64 tests de integración y unitarios pasando en verde (`mvnw test`).
  - Frontend: `npm run build` compilando limpio en 2.5s.
