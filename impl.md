# RELI-WebApp

- Página de inicio con el resultado del ultimo partido o el próximo partido.
- Página de jugadores con sus estadísticas individuales.
- Pagina de la clasificación de la liga.
- Página de la historia del equipo con los logros más importantes.
- Página de partidos con el calendario de los próximos partidos y los resultados de los partidos anteriores.
- Página de noticias relacionadas con el equipo.

### Implementaciones.

- IA integrada para generar noticias y resúmenes de partidos.
- Sistema de autenticación para usuarios registrados.
- API REST para gestionar datos del equipo y partidos.
- Despliegue en Vercel para el frontend y Heroku para el backend (futuro).

## DDBB.

- Jugador: id, nombre, dorsal, posición, foto_url.
- Partidos: id, nombre_rival, fecha, hora, lugar, resultado, local (boolean).
- Estadisticas (Jugador <-> Partidos): id, jugador_id, partido_id, goles, asistencias, amarillas, rojas.

---

# ========= HTTP Endpoints (Backend) =========

### =========================================
### RELI-WebApp API - requests.http
### =========================================

@host = http://localhost:8080
@adminUsername = admin
@adminPassword = Admin1234!

### =========================================
### Auth
### =========================================

### Login admin
POST {{host}}/api/users/login
Content-Type: application/json

{
  "identifier": "{{adminUsername}}",
  "password": "{{adminPassword}}"
}

### =========================================
### Users
### =========================================

### Registrar usuario normal
POST {{host}}/api/users/register
Content-Type: application/json

{
  "username": "user1",
  "email": "user1@reli.com",
  "password": "Password123"
}

### Listar usuarios - solo ADMIN
GET {{host}}/api/users?page=0&size=10&sortBy=username&direction=asc
Authorization: Basic {{adminUsername}} {{adminPassword}}

### =========================================
### Players
### =========================================

### Crear jugador - ADMIN
POST {{host}}/api/players
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "name": "Adrian Test",
  "nickname": "Adri",
  "jerseyNumber": 10,
  "position": "ALA",
  "photoUrl": "http://imagen.com/foto.jpg"
}

### Listar jugadores activos - publico
GET {{host}}/api/players?page=0&size=10&sortBy=name&direction=asc

### Actualizar jugador 1 - ADMIN
PUT {{host}}/api/players/1
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "name": "Adrian Actualizado",
  "nickname": "Adri",
  "jerseyNumber": 7,
  "position": "PIVOT",
  "photoUrl": "http://imagen.com/foto-actualizada.jpg"
}

### Soft delete jugador 1 - ADMIN
DELETE {{host}}/api/players/1
Authorization: Basic {{adminUsername}} {{adminPassword}}

### =========================================
### Seasons
### =========================================

### Crear temporada - ADMIN
POST {{host}}/api/seasons
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "name": "2026/2027",
  "current": true
}

### Listar temporadas - publico
GET {{host}}/api/seasons?page=0&size=10&sortBy=name&direction=asc

### Obtener temporada 1
GET {{host}}/api/seasons/1

### =========================================
### Competitions
### =========================================

### Crear competicion - ADMIN
POST {{host}}/api/competitions
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "name": "Liga",
  "seasonId": 1
}

### Listar competiciones - publico
GET {{host}}/api/competitions?page=0&size=10&sortBy=name&direction=asc

### Obtener competicion 1
GET {{host}}/api/competitions/1

### =========================================
### Matches
### =========================================

### Crear partido - ADMIN
POST {{host}}/api/matches
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "rival": "Rival FC",
  "date": "2026-06-20T19:00:00",
  "location": "Pabellon Municipal",
  "status": "SCHEDULED",
  "ourGoals": 0,
  "rivalGoals": 0,
  "competitionId": 1
}

### Listar partidos - publico
GET {{host}}/api/matches?page=0&size=10&sortBy=date&direction=desc

### Obtener partido 1
GET {{host}}/api/matches/1

### Actualizar partido 1 - ADMIN
PUT {{host}}/api/matches/1
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "rival": "Rival FC",
  "date": "2026-06-20T19:00:00",
  "location": "Pabellon Municipal",
  "status": "FINISHED",
  "ourGoals": 3,
  "rivalGoals": 2,
  "competitionId": 1
}

### =========================================
### Stats
### =========================================

### Crear estadistica - ADMIN
POST {{host}}/api/stats
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "playerId": 1,
  "matchId": 1,
  "goals": 2,
  "assists": 1,
  "yellowCards": 0,
  "redCards": 0,
  "mvp": true,
  "attended": true
}

### Listar estadisticas - publico
GET {{host}}/api/stats?page=0&size=10&sortBy=id&direction=asc

### Filtrar estadisticas por jugador
GET {{host}}/api/stats?playerId=1&page=0&size=10&sortBy=id&direction=asc

### Filtrar estadisticas por partido
GET {{host}}/api/stats?matchId=1&page=0&size=10&sortBy=id&direction=asc

### Obtener estadistica 1
GET {{host}}/api/stats/1

### =========================================
### Events
### =========================================

### Crear evento - ADMIN
POST {{host}}/api/events
Content-Type: application/json
Authorization: Basic {{adminUsername}} {{adminPassword}}

{
  "title": "Entrenamiento semanal",
  "description": "Sesion tactica y fisica del equipo",
  "date": "2026-06-18T20:00:00",
  "location": "Pabellon Municipal",
  "imageUrl": "https://example.com/training.jpg",
  "type": "TRAINING"
}

### Listar eventos - publico
GET {{host}}/api/events?page=0&size=10&sortBy=date&direction=desc

### =========================================
### Swagger / OpenAPI
### =========================================

### OpenAPI JSON
GET {{host}}/v3/api-docs

### Swagger UI
GET {{host}}/swagger-ui.html