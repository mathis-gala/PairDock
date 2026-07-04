import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowPath = path.join(repositoryRoot, '.github', 'workflows', 'ci.yml');
const rootPackageJson = JSON.parse(readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
};

function readWorkflow(): string {
  assert.ok(existsSync(workflowPath), 'CI workflow must exist at .github/workflows/ci.yml');
  return readFileSync(workflowPath, 'utf8');
}

test('CI workflow runs repository quality gates for pull requests and main pushes', () => {
  const workflow = readWorkflow();

  assert.match(workflow, /pull_request:/, 'workflow must run for pull requests');
  assert.match(workflow, /push:/, 'workflow must run for pushes');
  assert.match(workflow, /branches:\s*\[main\]/, 'workflow push trigger must target main');
  assert.match(workflow, /bun install --frozen-lockfile/, 'workflow must install with the Bun lockfile');

  for (const jobName of [
    'static-quality:',
    'prisma-migrations:',
    'api-tests:',
    'local-agent-tests:',
    'web-tests:',
    'build:',
  ]) {
    assert.ok(workflow.includes(jobName), `workflow must split CI into parallel ${jobName} job`);
  }

  for (const command of [
    'bun run prisma:generate',
    'bun run db:migrate',
    'bun run db:status',
    'bun run typecheck',
    'bun run lint',
    'bun run test:architecture',
    'bun run --filter @pairdock/api test',
    'bun run --filter @pairdock/local-agent test',
    'bun run --filter @pairdock/web test:unit',
    'bun run build',
  ]) {
    assert.ok(workflow.includes(command), `workflow must run ${command}`);
  }

  assert.match(workflow, /postgres:/, 'workflow must provision PostgreSQL for Prisma migration status');
  assert.match(workflow, /DATABASE_URL:/, 'workflow must provide DATABASE_URL to Prisma commands');
  assert.match(workflow, /timeout-minutes:/, 'workflow jobs and long test steps must have timeouts');
});

test('repository quality gates are exposed as root scripts', () => {
  for (const scriptName of ['prisma:generate', 'db:status', 'typecheck', 'lint', 'test', 'build']) {
    assert.ok(rootPackageJson.scripts?.[scriptName], `root package.json must define ${scriptName}`);
  }
});

test('CI uses Bun tooling and does not use npm lockfiles or commands', () => {
  const workflow = readWorkflow();

  assert.ok(existsSync(path.join(repositoryRoot, 'bun.lock')), 'bun.lock must be present');
  assert.equal(existsSync(path.join(repositoryRoot, 'package-lock.json')), false, 'package-lock.json must be absent');
  assert.doesNotMatch(workflow, /\bnpm\b|package-lock\.json/, 'workflow must not use npm or package-lock.json');
});
