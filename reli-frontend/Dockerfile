FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Los ARG llegan como variables de entorno al RUN y tienen prioridad sobre el .env.
# Si un ARG viene vacio (compose sin .env en raiz), Vite usa el valor de reli-frontend/.env
# como fallback (por eso .env NO esta en .dockerignore).
ARG VITE_API_URL
# Google Client ID fijado en la imagen (no depende de .env en tiempo de run)
ENV VITE_GOOGLE_CLIENT_ID=171677226442-o8rjufi8qjff6krvemrrgt6u553qcs5n.apps.googleusercontent.com
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_BUCKET
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
