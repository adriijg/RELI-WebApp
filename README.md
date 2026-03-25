# RELI-WebApp

## Documento de Diseño Técnico (TDD)

¡Perfecto! Vamos a formalizar el Documento de Diseño Técnico (TDD). Tener esto en tu repositorio de GitHub es lo que diferencia a un "picacódigo" de un desarrollador profesional.

Se ha creado el archivo `DOCUMENTACION.md` en la raíz del proyecto con la descripción del sistema, modelo de datos, roles y permisos, roadmap y guía de flujo de Git.

## Descripción

RELI-WebApp es una aplicación web dedicada al equipo de fútbol sala RELI. Esta aplicación proporciona información sobre el equipo, incluyendo jugadores, partidos, resultados, noticias y más. Está diseñada para mantener a los aficionados actualizados y conectados con su equipo favorito. Utiliza una arquitectura de microservicios con backend en Spring Boot y frontend en Angular, respaldada por una base de datos en Firebase o Supabase.

## Características

- **Información del Equipo**: Perfiles de jugadores, entrenador y staff técnico.
- **Calendario de Partidos**: Próximos partidos y resultados históricos.
- **Noticias y Actualizaciones**: Artículos sobre el equipo, transferencias y eventos.
- **Galería de Fotos**: Imágenes de partidos, entrenamientos y eventos del equipo.
- **Contacto**: Información para contactar al equipo o comprar entradas.
- **Responsive Design**: Optimizado para dispositivos móviles y de escritorio.
- **Autenticación**: Sistema de login para usuarios registrados (futuro).
- **API REST**: Backend con endpoints para gestionar datos del equipo.

## Tecnologías Utilizadas

- **Frontend**: Angular
- **Backend**: Spring Boot (Java)
- **Base de Datos**: Firebase o Supabase
- **Despliegue**: Vercel (futuro)

## Instalación

### Prerrequisitos

- Java 17 o superior
- Node.js y npm
- Angular CLI
- Cuenta en Firebase o Supabase

### Backend (Spring Boot)

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/RELI-WebApp.git
   cd RELI-WebApp/backend
   ```

2. Instala las dependencias con Maven:
   ```bash
   mvn install
   ```

3. Configura la base de datos (Firebase/Supabase) en `application.properties`.

4. Ejecuta la aplicación:
   ```bash
   mvn spring-boot:run
   ```

El backend estará disponible en `http://localhost:8080`.

### Frontend (Angular)

1. Navega al directorio del frontend:
   ```bash
   cd ../frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Ejecuta la aplicación:
   ```bash
   ng serve
   ```

El frontend estará disponible en `http://localhost:4200`.

## Uso

1. Asegúrate de que el backend esté ejecutándose.
2. Abre tu navegador y ve a `http://localhost:4200` para acceder a la aplicación.
3. Navega por las secciones del equipo, partidos y noticias.

## Estructura del Proyecto

```
RELI-WebApp/
├── backend/             # Backend en Spring Boot
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/    # Código Java
│   │   │   └── resources/
│   │   └── test/        # Tests
│   └── pom.xml          # Dependencias Maven
├── frontend/            # Frontend en Angular
│   ├── src/
│   │   ├── app/         # Componentes Angular
│   │   ├── assets/      # Imágenes y recursos
│   │   └── environments/# Configuraciones
│   ├── angular.json
│   └── package.json
├── README.md            # Este archivo
└── .gitignore
```

## Despliegue

En un futuro, la aplicación se desplegará en Vercel para el frontend y un servicio de hosting para el backend.

## Contribución

¡Las contribuciones son bienvenidas! Si deseas contribuir:

1. Haz un fork del proyecto.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`).
4. Push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Contacto

- **Equipo RELI**: [Sitio web oficial](https://www.equiporeli.com)
- **Email**: contacto@equiporeli.com
- **Redes Sociales**: [Facebook](https://facebook.com/equiporeli), [Twitter](https://twitter.com/equiporeli)

---

¡Apoya al equipo RELI y sigue todos los partidos!