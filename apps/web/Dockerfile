FROM oven/bun:1.3.13 AS build

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

FROM nginx:1.29-alpine AS runtime

COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY --chmod=755 deploy/web-entrypoint.sh /usr/local/bin/pairdock-web-entrypoint
COPY --from=build --chown=nginx:nginx /app/apps/web/dist /usr/share/nginx/html

USER nginx
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/pairdock-web-entrypoint"]
