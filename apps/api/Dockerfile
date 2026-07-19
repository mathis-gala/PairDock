FROM oven/bun:1.3.13 AS build

WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/local-agent/package.json packages/local-agent/package.json
COPY packages/shared-contracts/package.json packages/shared-contracts/package.json

RUN bun install --frozen-lockfile

COPY apps/api apps/api
COPY packages/domain packages/domain
COPY packages/shared-contracts packages/shared-contracts

ENV DATABASE_URL=postgresql://pairdock:pairdock@127.0.0.1:5432/pairdock
RUN bun run prisma:generate \
  && bun run --filter @pairdock/api typecheck

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--enable-source-maps \
    TSX_TSCONFIG_PATH=apps/api/tsconfig.json

WORKDIR /app

RUN apt-get update \
  && apt-get install --no-install-recommends -y openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/tsconfig.base.json ./tsconfig.base.json
COPY --from=build --chown=node:node /app/apps/api ./apps/api
COPY --from=build --chown=node:node /app/packages/domain ./packages/domain
COPY --from=build --chown=node:node /app/packages/shared-contracts ./packages/shared-contracts

USER node
EXPOSE 3000

CMD ["node", "--import", "tsx", "apps/api/src/main.ts"]
