FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --workspace=apps/backend

FROM base AS dev
WORKDIR /app/apps/backend
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/apps/backend/node_modules ./node_modules
COPY apps/backend/ .
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS builder
WORKDIR /app/apps/backend
COPY --from=deps /app/node_modules ../../node_modules
COPY --from=deps /app/apps/backend/node_modules ./node_modules
COPY apps/backend/ .
RUN npx prisma generate && npm run build

FROM base AS production
WORKDIR /app/apps/backend
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=deps /app/apps/backend/node_modules ./node_modules
RUN npx prisma generate
EXPOSE 3001
CMD ["node", "dist/index.js"]
