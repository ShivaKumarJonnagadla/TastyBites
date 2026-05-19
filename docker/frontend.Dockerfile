FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
RUN npm ci --workspace=apps/frontend

FROM base AS dev
WORKDIR /app/apps/frontend
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/apps/frontend/node_modules ./node_modules
COPY apps/frontend/ .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS builder
WORKDIR /app/apps/frontend
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/apps/frontend/node_modules ./node_modules
COPY apps/frontend/ .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
