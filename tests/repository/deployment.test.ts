import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('published releases build public multi-platform API and web images', () => {
  const workflowPath = path.join(repositoryRoot, '.github', 'workflows', 'release-images.yml');

  assert.ok(existsSync(workflowPath), 'release image workflow must exist');
  const workflow = readFileSync(workflowPath, 'utf8');

  assert.match(workflow, /release:\s*\n\s*types:\s*\[published\]/);
  assert.match(workflow, /packages:\s*write/);
  assert.match(workflow, /linux\/amd64,linux\/arm64/);
  assert.match(workflow, /apps\/api\/Dockerfile/);
  assert.match(workflow, /apps\/web\/Dockerfile/);
  assert.match(workflow, /github\.event\.release\.tag_name/);
  assert.match(workflow, /value=latest/);
});

test('server compose defaults to latest, runs migrations, and keeps services behind Caddy', () => {
  const composePath = path.join(repositoryRoot, 'deploy', 'docker-compose.yml');

  assert.ok(existsSync(path.join(repositoryRoot, 'apps', 'api', 'Dockerfile')));
  assert.ok(existsSync(path.join(repositoryRoot, 'apps', 'web', 'Dockerfile')));
  assert.ok(existsSync(composePath), 'server compose file must exist');

  const compose = readFileSync(composePath, 'utf8');

  assert.match(compose, /\$\{PAIRDOCK_IMAGE_REPOSITORY[^}]*\}\/pairdock-api:\$\{IMAGE_TAG:-latest\}/);
  assert.match(compose, /\$\{PAIRDOCK_IMAGE_REPOSITORY[^}]*\}\/pairdock-web:\$\{IMAGE_TAG:-latest\}/);
  assert.match(compose, /migrate:/);
  assert.match(compose, /service_completed_successfully/);
  assert.match(compose, /pairdock_proxy/);
  assert.doesNotMatch(compose, /^\s+ports:/m, 'PairDock services must not bypass the existing Caddy proxy');
});

test('Caddy routes PairDock domains and permits authenticated sockets and preview iframes', () => {
  const caddy = readFileSync(path.join(repositoryRoot, 'deploy', 'Caddyfile.pairdock'), 'utf8');

  assert.match(caddy, /http:\/\/\{\$PAIRDOCK_WEB_DOMAIN\}/);
  assert.match(caddy, /reverse_proxy pairdock-web:8080/);
  assert.match(caddy, /http:\/\/\{\$PAIRDOCK_API_DOMAIN\}/);
  assert.match(caddy, /reverse_proxy pairdock-api:3000/);
  assert.match(caddy, /connect-src[^\n]+https:\/\/\{\$PAIRDOCK_API_DOMAIN\}[^\n]+wss:\/\/\{\$PAIRDOCK_API_DOMAIN\}/);
  assert.match(caddy, /frame-src[^\n]+https:\/\/\*\.trycloudflare\.com/);
});

test('public deployment artifacts contain no maintainer-specific domain or registry namespace', () => {
  const deploymentPaths = [
    '.github/workflows/release-images.yml',
    'apps/web/Dockerfile',
    'deploy/Caddyfile.pairdock',
    'deploy/README.md',
    'deploy/docker-compose.yml',
    'deploy/pairdock.env.example',
  ];
  const deployment = deploymentPaths
    .map((deploymentPath) => readFileSync(path.join(repositoryRoot, deploymentPath), 'utf8'))
    .join('\n');

  assert.doesNotMatch(deployment, /mathis-db\.com|mathis-gala/i);
  assert.match(deployment, /PAIRDOCK_API_URL/);
  assert.match(deployment, /PAIRDOCK_IMAGE_REPOSITORY/);
});
