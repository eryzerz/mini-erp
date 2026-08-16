# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:22-alpine AS runner
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/nest-cli.json ./nest-cli.json

RUN chmod +x /app/apps/api/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
