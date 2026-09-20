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
- `GITHUB_WEBHOOK_SECRET`: secret shared only by GitHub and the API for signed webhook delivery.
- `PAIRDOCK_TRUSTED_PROXY_IPS`: optional comma-separated numeric IPs of the immediate trusted proxies, normally Caddy's address on `pairdock_proxy`; configure it for per-client pairing rate limits behind Caddy.
- `R2_PRIVATE_BUCKET`: private Cloudflare R2 bucket used for authenticated chat screenshots.
- `R2_PUBLIC_BUCKET` and `R2_PUBLIC_BASE_URL`: public R2 bucket and its custom HTTPS domain used for durable GitHub PR screenshots.
- `IMAGE_TAG`: optional release tag; defaults to `latest` when omitted.

`PAIRDOCK_API_URL` is injected into `/config.js` when the web container starts. The same published web image can therefore be deployed under any domain without rebuilding it.

Generate `POSTGRES_PASSWORD`, `AUTH_TOKEN_SECRET`, `AUTH_STATE_SECRET` and `GITHUB_WEBHOOK_SECRET` independently:

```bash
openssl rand -hex 32
```

Desktop devices enroll through an expiring code approved by their developer in the
browser. The API stores their ownership and credential hashes in PostgreSQL; operators
do not provision one static token per desktop user. `AGENT_AUTH_CREDENTIALS_JSON` is
optional, and Compose defaults it to `{}`. Omitted, empty and `{}` values are accepted
when no legacy CLI agents need static credentials. Remove any unfilled example value
from a server environment file before using this default.

For existing administratively provisioned CLI agents only, generate an independent
token per agent and put the map in `AGENT_AUTH_CREDENTIALS_JSON`. Each token must be
unique and contain at least 32 bytes:

```env
AGENT_AUTH_CREDENTIALS_JSON='{"agent-local-1":{"token":"<first-generated-token>","projectKeys":["project-a"]},"agent-local-2":{"token":"<second-generated-token>","projectKeys":["project-b","project-c"]}}'
```

Every project key published by a static CLI agent must be present in that agent's `projectKeys`, and a key may appear under only one credential. Keep those credentials stable across normal updates. Give each workstation only its own token; never share the full JSON map with agent operators. Static agents remain administratively managed; they are not listed as self-service paired devices. In particular, changing `POSTGRES_PASSWORD` does not update the password already stored by PostgreSQL. `DEV_PM_AUTH_ENABLED` is hard-disabled by Compose.

Create separate private and public R2 buckets. Generate an R2 API token with object read/write/delete access to both, expose only the public bucket through the `R2_PUBLIC_BASE_URL` custom domain, and fill all six `R2_*` variables from `pairdock.env.example`. Production API startup fails when this durable storage configuration is incomplete.

## Security before exposing PairDock

- Keep the PairDock API and web containers reachable only through Caddy on the external proxy network. The database is attached only to Compose's internal network.
- Restrict SSH to keys, disable password login, keep Docker and the host patched, and allow administrative ports only from a trusted network.
- In Cloudflare, keep TLS mode on **Full (strict)** and configure rate limits for authentication and prompt endpoints. Start conservatively (for example 30 authentication requests and 10 prompt submissions per minute and source IP), monitor legitimate usage, then tighten the limits.
- Back up the `pairdock_database` volume and test restoration before the first production upgrade.
- Never expose Docker's socket or TCP API. The local agent needs access to the developer workstation's Docker daemon, so run it only under a dedicated, trusted OS account.
- Treat `sandbox.network: host-services` as privileged access to explicitly listed local test services. Use dedicated, least-privilege test credentials in `sandbox.env`; never put production credentials in a project manifest.
- Keep GitHub App repository permissions at the documented minimum and install it only on repositories intended for PairDock.
- Keep `/webhooks/github` publicly reachable through Cloudflare without an Access login or interactive challenge. PairDock authenticates deliveries with GitHub's HMAC signature; rate-limit the route, but do not cache it.

PairDock limits WebSocket frames, prompt sizes, captured output, and validation logs. It also runs Codex without inherited workstation secrets or network access, runs project checks on the host with a filtered environment, and binds preview ports to loopback. These controls reduce impact; they do not make arbitrary PM-requested code safe to run directly on a developer host.

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

### Client addresses for pairing rate limits

The API uses the direct socket peer for pairing rate limits unless that peer is
explicitly listed in `PAIRDOCK_TRUSTED_PROXY_IPS`. For a listed peer only, it accepts a
single numeric `X-Real-IP` value. It never trusts `X-Forwarded-For`, CIDR ranges or a
blanket proxy setting. An empty allowlist is safe for direct API access, but all requests
through Caddy then share Caddy's rate-limit bucket and can throttle unrelated developers.

Inspect Caddy's actual address on the shared network:

```bash
docker inspect --format '{{(index .NetworkSettings.Networks "pairdock_proxy").IPAddress}}' <caddy-container>
```

Put that exact IP in the server-only environment file:

```env
PAIRDOCK_TRUSTED_PROXY_IPS=<actual-caddy-proxy-network-ip>
```

For multiple immediate proxies, separate their exact numeric IPs with commas. Prefer
assigning Caddy a stable IP within the existing proxy network's configured subnet. If
Caddy's address changes when its container is recreated, update this value and recreate
the API service. This setting is not a list of public client IPs or Cloudflare edge ranges.

The provided Caddyfile overwrites `X-Real-IP` with Cloudflare's `CF-Connecting-IP` value.
Its API listener must therefore accept traffic only from the trusted Cloudflare Tunnel
path. Enforce that restriction with the host/network configuration; do not expose this
listener directly to arbitrary clients or untrusted containers that could forge
`CF-Connecting-IP`. Trusting Caddy's socket address alone does not establish the upstream
header's authenticity. If your deployment does not use this Cloudflare-to-Caddy path,
configure Caddy to overwrite `X-Real-IP` from your own verified client-address source
before adding it to the API allowlist.

Configure the external providers with these exact environment-derived URLs:

- GitHub callback: value of `GITHUB_REDIRECT_URI`.
- GitHub setup URL: `${PAIRDOCK_API_URL}/auth/developer/setup`.
- GitHub App webhook: open the app settings, enable the webhook, set its URL to
  `${PAIRDOCK_API_URL}/webhooks/github`, use the same secret as
  `GITHUB_WEBHOOK_SECRET`, and subscribe only to **Pull requests**. Under
  **Advanced → Recent deliveries**, a `pull_request` delivery must receive HTTP
  `202`. PairDock persists that event; browser refreshes read the persisted
  status and no GitHub polling or cron is required.
- Slack redirect: value of `SLACK_REDIRECT_URI`.

## Deploy, update, or roll back

Before an update, copy the release's current `deploy/docker-compose.yml` to `/opt/pairdock/docker-compose.yml`; pulling images alone does not add new services, environment variables, or healthchecks. Back up the server-only environment and database first:

```bash
cd /opt/pairdock
cp pairdock.env pairdock.env.before-update
docker compose --env-file pairdock.env exec -T database \
  pg_dump -U pairdock -d pairdock -Fc > pairdock-before-update.dump
```

Default `latest` deployment:

```bash
cd /opt/pairdock
docker compose --env-file pairdock.env config --quiet
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

To persist a selected release, add `IMAGE_TAG=v1.2.3` to `pairdock.env`. The PostgreSQL data remains in the named volume `pairdock_pairdock_database`; normal `pull` and `up -d` do not erase it. The one-shot `migrate` service applies pending Prisma migrations before the API starts and blocks the deployment if a migration fails.

Inspect failures with:

```bash
docker compose --env-file pairdock.env ps
docker compose --env-file pairdock.env logs --tail=200 migrate api web database
```

## Local developer agent and previews

The macOS desktop companion is the primary V1 setup path. Give developers the public
API address and an actual macOS build. They select **Continuer dans le navigateur**,
sign in with GitHub, compare the device code and approve the association themselves.
The application receives and securely stores its credential without token copying.
Developers then select their repositories and scripts in the GUI and start the agent.
See the [desktop guide](../docs/agent-desktop.md) for the complete flow and distribution
requirements. Windows and Linux desktop installers are not part of this V1.

Apply the agent-enrollment migration before starting the new API. Keep `FRONTEND_URL`
(supplied by `PAIRDOCK_WEB_URL` in Compose) on the same public origin as the web app:
it controls verification links, OAuth return navigation and API CORS. Make pairing
endpoints reachable by the app and browser; the API itself enforces code expiry,
single-use claim, developer approval, ownership and rate limits.

The developer's web **Agents** page lists their paired devices and supports confirmed
revocation. Revocation disconnects the device and blocks its credential; no Compose
restart is needed. Back up the database to retain paired device ownership across
upgrades. Keep the desktop profile on the workstation, never in the server environment
or a repository.

The agent stays on the developer workstation because it needs the source repository,
Git credentials, project tools and Docker for shared preview tunnels. The desktop app
bundles Codex and provides a browser sign-in action. Production signing, notarization
and publication of desktop installers must be configured separately from server image
publication; do not advertise a download before that artifact exists.

### Advanced CLI compatibility

An existing CLI agent can still connect outbound to the public API with the token
mapped to its exact agent id in the optional `AGENT_AUTH_CREDENTIALS_JSON`:

```bash
PAIRDOCK_AGENT_CONFIG_PATH="$HOME/.pairdock/agent-<agent-id>.json" \
pairdock-agent login \
  --backend-url "$PAIRDOCK_API_URL" \
  --agent-id <agent-id> \
  --token <token-for-this-agent-id> \
  --capability session.prepare \
  --capability readiness.check \
  --capability agent.prompt \
  --capability git.pushBranch \
  --project <project-key>=<absolute-repository-path>

PAIRDOCK_AGENT_CONFIG_PATH="$HOME/.pairdock/agent-<agent-id>.json" \
PAIRDOCK_AGENT_SESSION_STATE_PATH="$HOME/.pairdock/sessions-<agent-id>.json" \
pairdock-agent start
```

Every concurrently running agent needs a unique agent id, config path, and session-state path, even when agents connect to different PairDock backends. The agent id also scopes local Docker previews and dependency caches, so reusing it can make one process clean up another process's resources. Keep each production token stable across normal upgrades; updating the local-agent code does not require another `login`.

For PairDock self-preview testing, the production PairDock agent may start a host-side companion agent connected only to the preview API. Add `previewCompanions.<outer-project-key>.agentConfigPath` to the outer agent JSON and point it to a separate local development-agent profile. PairDock replaces that profile's backend URL and token with per-preview loopback credentials, keeps its state separate, and limits nesting to one level. Do not add credentials to `pairdock.yml` or commit local agent config files.

Use Codex CLI 0.138.0 or newer. PairDock's readiness check rejects older versions because they cannot enforce the restricted filesystem permission profile used for PM-triggered work.

Preview containers and Cloudflare quick tunnels still run on the developer workstation. The Caddy policy permits `https://*.trycloudflare.com` preview iframes. If the workstation sleeps or the agent stops, deployed PairDock remains online, but previews and new agent work are unavailable until the agent reconnects.
