# Frontend Dockerfile - Multi-stage Build
# Aşama 1: Build (Node.js)
FROM node:20-alpine AS build

WORKDIR /app

# Bağımlılıkları önce kopyala (cache optimizasyonu)
COPY package.json package-lock.json ./
RUN npm ci

# Build-time environment değişkenleri (ARG olarak alınır)
# Production'da boş bırakılır — nginx proxy /api yönlendirmesi yapar
ARG VITE_API_URL=
ARG VITE_GOOGLE_CLIENT_ID=

# Ortam değişkenlerini build sırasında kullan
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Kaynak kodunu kopyala ve build et
COPY . .
RUN npm run build

# Aşama 2: Serve (Nginx)
FROM nginx:alpine

# Nginx konfigürasyonu (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build çıktısını nginx'e kopyala
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
