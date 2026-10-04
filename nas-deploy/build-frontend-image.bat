@echo off
cd /d "E:\Proyectos\RELI-WebApp"

echo === Construyendo imagen del frontend con Google Client ID fijo ===
docker build -t reli-webapp-frontend:fixed ./reli-frontend

echo === Exportando imagen a tar en carpeta nas-deploy ===
docker save -o reli-webapp-frontend-fixed.tar reli-webapp-frontend:fixed

echo.
echo === Listo! Archivo creado: reli-webapp-frontend-fixed.tar ===
echo Este archivo contiene la imagen con VITE_GOOGLE_CLIENT_ID incluido.
echo Para cargar en el NAS: docker load -i reli-webapp-frontend-fixed.tar