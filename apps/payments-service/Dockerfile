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
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3004
CMD ["/entrypoint.sh"]

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=payments-service

FROM node:20-slim AS production
RUN apk add --no-cache postgresql-client
WORKDIR /app
RUN groupadd -g 1001 nodejs && useradd -r -u 1001 -g nodejs nestjs
COPY --from=builder /app/dist ./dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder /app/apps/payments-service/prisma ./prisma
USER nestjs
EXPOSE 3004
RUN npx prisma migrate deploy --schema=apps/payments-service/prisma/schema.prisma
CMD ["node", "dist/apps/payments-service/main.js"]