FROM oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4 AS build

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

FROM node:25-bookworm-slim@sha256:81db02c4b671288a03915da9534dbd54f96d0e7c24d80ccc54f5b36b2e684370 AS runtime

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

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "--import", "tsx", "apps/api/src/main.ts"]
