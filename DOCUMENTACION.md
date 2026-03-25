# ⚽ RELI WebApp - Sistema de Gestión de Futsal

Este proyecto es una plataforma Full-Stack para la gestión integral de un equipo de fútbol sala de barrio, permitiendo el seguimiento de estadísticas, convocatorias e historial por temporadas.

---

## 🏗️ Arquitectura del Sistema

- **Frontend**: Angular 19+ (Responsive para móviles).
- **Backend**: Spring Boot 3+ (Java 17/21) con Spring Security.
- **Base de Datos**: PostgreSQL (Alojado en Supabase).
- **Infraestructura**: GitHub (Control de versiones), Vercel (Deploy Front), Render/Railway (Deploy Back).

---

## 📊 Modelo de Datos (Entidades)

### 1. Jugador
- Representa a cada miembro del equipo.
- `id` (PK), `nombre`, `apodo`, `dorsal`, `posicion` (Portero, Cierre, Ala, Pivot), `foto_url`, `activo` (boolean).

### 2. Temporada
- Permite segmentar los datos en el tiempo.
- `id` (PK), `nombre` (Ej: "2025/26"), `actual` (boolean).

### 3. Competición
- Diferencia entre los distintos torneos.
- `id` (PK), `nombre` (Ej: "Liga Municipal", "Copa Primavera"), `temporada_id` (FK).

### 4. Partido
- `id` (PK), `rival`, `fecha`, `lugar`, `resultado`, `competicion_id` (FK).

### 5. Estadística (Tabla de Hechos)
- Relaciona jugadores con partidos para generar el ranking.
- `id` (PK), `jugador_id` (FK), `partido_id` (FK), `goles`, `asistencias`, `amarillas`, `rojas`, `mvp` (boolean).

---

## 🔐 Roles y Permisos

| Rol   | Permisos |
|------|----------|
| **Admin (Tú)** | CRUD completo de Jugadores, Partidos, Temporadas y Estadísticas. |
| **User (Equipo)** | Lectura de estadísticas, visualización de calendario y confirmación de asistencia. |

---

## 🛣️ Roadmap de Desarrollo

### Fase 1: Cimientos (Backend & DB)
- [ ] Configuración de la base de datos en Supabase.
- [ ] Creación de Entidades JPA en Spring Boot.
- [ ] Implementación de Repositorios y Servicios básicos.

### Fase 2: Interfaz Visual (Angular & CSS)
- [ ] Maquetación de la tabla de clasificación.
- [ ] Diseño de "Cards" de jugadores (Fichas de fichajes).
- [ ] Creación del Dashboard de Admin para subir resultados.

### Fase 3: Lógica Avanzada
- [ ] Cálculo dinámico de Pichichi y Asistencias por temporada.
- [ ] Sistema de histórico (Selector de temporadas).
- [ ] Autenticación de usuarios.

---

## 🚀 Guía de Git (Flujo de Trabajo)

- `main`: Código estable y producción.
- `develop`: Integración de nuevas funcionalidades.
- `feature/*`: Desarrollo de tareas específicas (ej: feature/modelo-datos).
