# Despliegue continuo (CD) en el NAS

Este directorio contiene lo necesario para desplegar RELI-WebApp en el NAS Synology
de forma **automatica** a partir de los cambios en `main`.

## Arquitectura

```
push a main
   │
   ├─ Job "Build & push images"  (runner de GitHub, ubuntu-latest)
   │     - construye backend + frontend
   │     - publica en GHCR y Docker Hub (tags: latest + sha)
   │
   └─ Job "Deploy on NAS"  (runner self-hosted, EN el NAS)
         - hace login en GHCR/Docker Hub
         - copia docker-compose.nas.yml a /volume1/docker/reli-app
         - docker compose pull && docker compose up -d
```

El NAS tiene **IP privada** (`192.168.1.178`), por lo que un runner de GitHub en la
nube no puede alcanzarlo. La solucion es un **runner self-hosted dentro del NAS**:
vive en tu LAN, controla el Docker del propio NAS y no requiere SSH ni abrir puertos.

## Puesta en marcha (una sola vez)

### 1. Secretos y variables en GitHub (repo → Settings → Secrets and variables → Actions)

**Secrets:**

| Nombre | Valor |
|---|---|
| `DOCKERHUB_USERNAME` | tu usuario de Docker Hub |
| `DOCKERHUB_TOKEN` | access token de Docker Hub (Read & Write) |
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | anon key de Supabase |
| `VITE_SUPABASE_BUCKET` | bucket de imagenes (p. ej. `images`) |

**Variables (opcionales, tienen valor por defecto):**

| Nombre | Por defecto | Descripcion |
|---|---|---|
| `DEPLOY_PATH` | `/volume1/docker/reli-app` | carpeta de despliegue en el NAS |
| `DEPLOY_IMAGE_REGISTRY` | `ghcr.io/<owner>` | registry del que tira el NAS |

### 2. Generar el token de registro (un solo uso)

El runner se registra con un token temporal (caduca en ~1h) y luego **reutiliza su
configuracion** (volumen `reli-runner-config`), por lo que **no se guarda ningun
secreto de larga duracion** en el NAS. Desde tu PC con `gh` autenticado:

```bash
gh api -X POST repos/adriijg/RELI-WebApp/actions/runners/registration-token --jq .token
```

### 3. Levantar el runner en el NAS

En el NAS (Container Manager o por SSH), crea una carpeta, p. ej. `/volume1/docker/github-runner`,
y coloca dentro:

- `docker-compose.runner.yml` (copialo de este repo)
- `.env` (copia de `runner.env.example`) con `RUNNER_TOKEN=<token del paso 2>`

Luego:

```bash
cd /volume1/docker/github-runner
sudo docker compose -f docker-compose.runner.yml up -d
```

Verifica en GitHub → Settings → Actions → Runners que aparece `reli-nas` como **Idle**.

### 4. `.env` real del proyecto en el NAS

En `/volume1/docker/reli-app/.env` deben estar los secretos de produccion
(mismos que `api-backend/.env.example`). Este fichero **no** lo toca el CD.

### 5. Probar

Haz un push a `main` o lanza el workflow **CD** a mano (Actions → CD → Run workflow).
Cuando termine, el NAS habra hecho `pull` + `up -d` con la imagen nueva.

## Notas

- Las imagenes deben ser **accesibles desde el NAS**. Si los paquetes de GHCR son
  privados, el paso de login del workflow (con `GITHUB_TOKEN`) ya lo resuelve.
- Si prefieres no usar Docker Hub, elimina los pasos de login/metadata de Docker Hub
  en `.github/workflows/cd.yml`.
- Seguridad: al ser un runner self-hosted con acceso al socket de Docker, evita
  ejecutarlo con `pull_request` de repos publicos. El CD solo corre en `push` a `main`.
