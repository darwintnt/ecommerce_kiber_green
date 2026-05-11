FROM node:20 AS base
WORKDIR /app
RUN npm install -g pnpm@9

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm install --frozen-lockfile
EXPOSE 3003
CMD ["pnpm", "start:dev", "--filter=inventory-service"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=inventory-service

FROM node:20-slim AS production
WORKDIR /app
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nestjs
COPY --from=builder /app/dist ./dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
USER nestjs
EXPOSE 3003
CMD ["node", "dist/apps/inventory-service/main.js"]