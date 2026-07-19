# PairDock production deployment

PairDock can share an existing Cloudflare Tunnel and Caddy instance. PairDock keeps its own containers, PostgreSQL volume, secrets, and Compose project. No deployment hostname or registry owner is compiled into the images.

## Release images

Publishing a GitHub release runs `.github/workflows/release-images.yml`. The workflow validates the released commit, then publishes multi-platform images for `linux/amd64` and `linux/arm64`:

- `ghcr.io/<repository-owner>/pairdock-api:<release-tag>`
- `ghcr.io/<repository-owner>/pairdock-web:<release-tag>`
- `sha-<commit>` for immutable diagnostics
- `latest` for non-prerelease releases

GitHub supplies `GITHUB_TOKEN` automatically; no personal access token is required. After the first publication, make both GHCR packages public if the server must pull anonymously. Set `PAIRDOCK_IMAGE_REPOSITORY` on the server to `ghcr.io/<repository-owner>` (or the organization that owns the repository).

## Deployment environment

Copy `deploy/pairdock.env.example` to a file stored only on the server, for example `/opt/pairdock/pairdock.env`. Replace every placeholder and protect it with `chmod 600`. Do not commit this file.

The public configuration is environment-driven:

- `PAIRDOCK_IMAGE_REPOSITORY`: GHCR namespace, without a trailing slash.
- `PAIRDOCK_WEB_DOMAIN` and `PAIRDOCK_API_DOMAIN`: hostnames used by Caddy, without scheme or path.
- `PAIRDOCK_WEB_URL` and `PAIRDOCK_API_URL`: complete HTTPS origins used by API CORS and the browser.
- `GITHUB_REDIRECT_URI` and `SLACK_REDIRECT_URI`: exact OAuth callback URLs configured with the providers.
- `IMAGE_TAG`: optional release tag; defaults to `latest` when omitted.

`PAIRDOCK_API_URL` is injected into `/config.js` when the web container starts. The same published web image can therefore be deployed under any domain without rebuilding it.

Generate `POSTGRES_PASSWORD`, `AUTH_TOKEN_SECRET`, `AUTH_STATE_SECRET`, and `AGENT_AUTH_TOKEN` independently:

```bash
openssl rand -hex 32
```

Keep them stable across normal updates. In particular, changing `POSTGRES_PASSWORD` does not update the password already stored by PostgreSQL. `DEV_AUTH_ENABLED` is hard-disabled by Compose.

## One-time server setup

Create the PairDock directory and the external proxy network:

```bash
sudo mkdir -p /opt/pairdock
sudo chown "$USER":"$USER" /opt/pairdock
docker network inspect pairdock_proxy >/dev/null 2>&1 || docker network create pairdock_proxy
```

Copy `deploy/docker-compose.yml` to `/opt/pairdock/docker-compose.yml` and the completed environment file to `/opt/pairdock/pairdock.env`.

Attach the existing `caddy` service to the shared network and pass the two non-secret domain variables to it:

```yaml
services:
  caddy:
    environment:
      PAIRDOCK_WEB_DOMAIN: ${PAIRDOCK_WEB_DOMAIN}
      PAIRDOCK_API_DOMAIN: ${PAIRDOCK_API_DOMAIN}
    networks:
      - default
      - pairdock_proxy

networks:
  pairdock_proxy:
    external: true
    name: pairdock_proxy
```

Make those variables available to the existing stack's Compose command, either in its server-only environment file or with `--env-file`. Append `deploy/Caddyfile.pairdock` to its Caddyfile, then recreate and validate Caddy:

```bash
cd /path/to/existing-stack
docker compose --env-file /opt/pairdock/pairdock.env up -d caddy
docker compose --env-file /opt/pairdock/pairdock.env exec caddy caddy validate --config /etc/caddy/Caddyfile
docker compose --env-file /opt/pairdock/pairdock.env exec caddy caddy reload --config /etc/caddy/Caddyfile
```

In the Cloudflare Tunnel, add the values of `PAIRDOCK_WEB_DOMAIN` and `PAIRDOCK_API_DOMAIN` as public hostnames. Reuse the HTTP service target that already reaches Caddy, commonly `http://caddy:80` for a containerized tunnel or `http://localhost:80` for a system service.

Configure the external providers with these exact environment-derived URLs:

- GitHub callback: value of `GITHUB_REDIRECT_URI`.
- GitHub setup URL: `${PAIRDOCK_API_URL}/auth/developer/setup`.
- Slack redirect: value of `SLACK_REDIRECT_URI`.

## Deploy, update, or roll back

Default `latest` deployment:

```bash
cd /opt/pairdock
docker compose --env-file pairdock.env pull
docker compose --env-file pairdock.env up -d --wait
docker compose --env-file pairdock.env ps
```

Pinned deployment or rollback:

```bash
cd /opt/pairdock
IMAGE_TAG=v1.2.3 docker compose --env-file pairdock.env pull
IMAGE_TAG=v1.2.3 docker compose --env-file pairdock.env up -d --wait
```

To persist a selected release, add `IMAGE_TAG=v1.2.3` to `pairdock.env`. The PostgreSQL data remains in the named volume `pairdock_pairdock_database`; normal `pull` and `up -d` do not erase it.

Inspect failures with:

```bash
docker compose --env-file pairdock.env ps
docker compose --env-file pairdock.env logs --tail=200 migrate api web database
```

## Local developer agent and previews

The agent stays on the developer workstation because it needs the source repository, Codex CLI, Git credentials, and Docker. It connects outbound to the public API with the same `AGENT_AUTH_TOKEN` stored on the server:

```bash
pairdock-agent login \
  --backend-url "$PAIRDOCK_API_URL" \
  --agent-id <agent-id> \
  --token <AGENT_AUTH_TOKEN> \
  --project <project-key>=<absolute-repository-path>
```

Preview containers and Cloudflare quick tunnels still run on the developer workstation. The Caddy policy permits `https://*.trycloudflare.com` preview iframes. If the workstation sleeps or the agent stops, deployed PairDock remains online, but previews and new agent work are unavailable until the agent reconnects.
