# Deployment security audit — 2026-07-19

## Scope

This review covers the PairDock API, browser app, local agent, Docker sandboxes, release workflow, deployment Compose stack, authentication boundaries, WebSocket protocol, dependencies, and secret handling. Testing used only the local repository and disposable local containers/databases; no public or production target was scanned.

## Resolved findings

| Severity | Finding | Resolution |
| --- | --- | --- |
| Critical | Project-defined checks executed on the developer host with a shell and inherited environment. | Checks now run in fresh, networkless, read-only-capable Docker sandboxes with bounded output and a hard timeout. |
| Critical | The Codex child process inherited unrelated workstation secrets, while legacy `workspace-write` still allowed broad read access outside the worktree. | The harness now builds an explicit environment allowlist and uses a restricted Codex permission profile: only minimal platform paths and the worktree are readable, common credential files are denied, network access is disabled, and API/cloud/database credentials are never forwarded. |
| High | Docker/tunnel command construction could interpret project-controlled values as shell syntax or Docker options. | Host commands use argument arrays with `shell: false`; container images, URLs, ports, and commands are validated before execution. |
| High | A single server-wide agent token allowed identity spoofing and cross-project session handling. | Unique per-agent credentials now bind an agent id to an exact project-key allowlist; registration and every session/readiness event are authorization-checked. |
| High | Preview health checks could target arbitrary hosts and preview ports could bind publicly. | Health checks are restricted to loopback and Docker port mappings are forced to `127.0.0.1`. |
| High | Vulnerable transitive versions of `multer` and `@hono/node-server` were present. | Dependency overrides upgrade to patched releases; the lockfile was regenerated and the package audit is clean. |
| Medium | Preview and validation containers had broad default Linux privileges. | Containers now drop all capabilities, use `no-new-privileges`, bounded PIDs, non-root users, read-only mounts/filesystems where compatible, and isolated temporary filesystems. |
| Medium | Sensitive-file and log redaction rules covered too few common credential formats. | Policies now cover package-manager, cloud, SSH, Kubernetes, private-key, DSN, JWT, and credential-URL patterns while allowing documented example templates. |
| Medium | WebSocket messages, prompts, diffs, and captured logs were insufficiently bounded. | Transport and schema limits now reject oversized input and cap persisted/redelivered output. |
| Medium | CI actions and runtime images used mutable tags. | Actions use verified full commit SHAs; runtime images use digests; release images include provenance and SBOM attestations. |

## Verification

- Package audit: no known vulnerable dependency after the overrides.
- Secret scans: no committed credential found. An ignored local environment file contains credentials and was intentionally left untouched; history scans found no leak.
- Static security scan: no remaining confirmed production vulnerability. Remaining alerts were reviewed as framework/policy false positives for fixed-provider redirects, a same-origin runtime configuration script, and Nginx header inheritance without server-level headers.
- API unit, integration, and end-to-end suites passed.
- Local-agent integration, web unit, and architecture suites passed.
- Lint, type checking, application builds, Compose validation, Docker image builds, container health checks, non-root users, read-only filesystems, dropped capabilities, and `no-new-privileges` were verified.

## Operational requirements and residual risk

- Production must provide `AGENT_AUTH_CREDENTIALS_JSON`; the legacy shared `AGENT_AUTH_TOKEN` is intentionally unsupported.
- Local agents require Codex CLI 0.138.0 or newer so restricted filesystem permission profiles can be enforced; readiness fails closed on older or unparseable versions.
- Each local agent remains a trusted execution component. Docker-daemon membership is effectively host-level privilege; isolate the agent OS account and never expose the Docker socket.
- `host-services` preview networking is an explicit usability/security trade-off. Prefer the default networkless mode. If required, expose only disposable test services with least-privilege credentials.
- Browser bearer tokens remain JavaScript-accessible in the MVP. The strict CSP, no third-party scripts, short redirect fragment lifetime, and input/output controls reduce exposure. Moving authentication to server-managed `HttpOnly` cookies is recommended before adding third-party browser scripts or relaxing CSP.
- Cloudflare/Caddy policy, host firewalling, SSH hardening, backups, alerting, rate limiting, and TLS must be configured and monitored on the deployment host. They cannot be proven from this repository alone.
- A live authenticated penetration test was not run because no dedicated staging target was in scope. Run one against staging before broad public access and after major authentication or sandbox changes.
