FROM oven/bun:1.3.14@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4 AS build

WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/local-agent/package.json packages/local-agent/package.json
COPY packages/shared-contracts/package.json packages/shared-contracts/package.json

RUN bun install --frozen-lockfile

COPY apps/web apps/web
COPY packages/shared-contracts packages/shared-contracts

RUN bun run --filter @pairdock/web build

FROM nginx:1.31-alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752 AS runtime

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --chmod=755 deploy/web-entrypoint.sh /usr/local/bin/pairdock-web-entrypoint
COPY --from=build --chown=nginx:nginx /app/apps/web/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/usr/local/bin/pairdock-web-entrypoint"]
