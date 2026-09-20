import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useDeveloperProjects } from '../../../../apps/web/src/hooks/use-developer-projects.js';
import { DeveloperHomePage } from '../../../../apps/web/src/views/developer-home-page.js';

Object.assign(globalThis, { React });

test('developer readiness mutation stays pending until a fresh result is installed for only the checked project', async (context) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  context.after(() => queryClient.clear());
  const queryKey = ['developer-projects', 'test-token'];
  const projects = [
    { id: 'project-1', name: 'First', readiness: null },
    { id: 'project-2', name: 'Second', readiness: null },
  ];
  queryClient.setQueryData(queryKey, projects);
  const fresh = { ok: true, checks: [], updatedAt: '2026-09-20T10:00:01.000Z' };
  let reads = 0;
  let finishRead: (response: Response) => void = () => assert.fail('Final read was not reached.');
  let finalRead: () => void = () => undefined;
  const reachedFinalRead = new Promise<void>((resolve) => {
    finalRead = resolve;
  });
  context.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, options?: RequestInit) => {
    if (options?.method === 'POST') return Response.json({ requested: true }, { status: 202 });
    reads += 1;
    if (reads === 1) return Response.json(null);
    finalRead();
    return new Promise<Response>((resolve) => {
      finishRead = resolve;
    });
  });
  let requestReadiness: (projectId: string) => Promise<unknown> = async () => assert.fail('Hook did not render.');
  function Consumer() {
    const state = useDeveloperProjects('test-token');
    requestReadiness = state.requestReadinessMutation.mutateAsync;
    return null;
  }
  renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <Consumer />
    </QueryClientProvider>,
  );
  const pending = requestReadiness('project-1');
  await reachedFinalRead;
  assert.equal(queryClient.isMutating(), 1);
  assert.deepEqual(queryClient.getQueryData(queryKey), projects);
  finishRead(Response.json(fresh));
  await pending;
  assert.equal(queryClient.isMutating(), 0);
  assert.deepEqual(queryClient.getQueryData(queryKey), [{ ...projects[0], readiness: fresh }, projects[1]]);
});

test('overlapping project checks retain their own pending state, errors, retries and cached results', async (context) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { gcTime: 0 }, queries: { retry: false } } });
  context.after(() => queryClient.clear());
  const queryKey = ['developer-projects', 'test-token'];
  const previous = { ok: true, checks: [], updatedAt: '2026-09-20T10:00:00.000Z' };
  const fresh = { ok: true, checks: [], updatedAt: '2026-09-20T10:00:01.000Z' };
  const projects: DeveloperProjectSummary[] = ['A', 'B'].map((name) => ({
    id: name,
    name: `Project ${name}`,
    description: null,
    repoFullName: `team/${name}`,
    defaultBranch: 'main',
    defaultModelId: 'test-model',
    defaultReasoningEffort: 'medium',
    agentProjectKey: name,
    sourceControlAccountLogin: 'team',
    pmCanStartSessions: true,
    pmMemberCount: 0,
    pmMembers: [],
    agentAvailability: 'online',
    readiness: previous,
    sessions: [],
  }));
  queryClient.setQueryData(queryKey, projects);
  queryClient.setQueryData(['developer-project-setup', 'test-token'], { repositories: [], agents: [] });
  queryClient.setQueryData(['developer-agents', 'test-token'], []);
  const readCounts = new Map<string, number>();
  const responses = new Map<string, (response: Response) => void>();
  context.after(() => {
    for (const respond of responses.values()) respond(Response.json({ message: 'Test finished.' }, { status: 503 }));
  });
  const waiting = new Map<string, () => void>();
  context.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, options?: RequestInit) => {
    const projectId = new URL(String(input)).pathname.split('/')[3] ?? '';
    if (options?.method === 'POST') return Response.json({ requested: true }, { status: 202 });
    const count = (readCounts.get(projectId) ?? 0) + 1;
    readCounts.set(projectId, count);
    if (count % 2 === 1) return Response.json(previous);
    return new Promise<Response>((resolve) => {
      responses.set(projectId, resolve);
      waiting.get(projectId)?.();
    });
  });
  let requestReadiness: (projectId: string) => Promise<unknown> = async () => assert.fail('Hook did not render.');
  let states: Record<string, { isPending: boolean; error: string | null }> = {};
  function Consumer({ accessToken = 'test-token' }: { accessToken?: string }) {
    const state = useDeveloperProjects(accessToken);
    requestReadiness = state.requestReadinessMutation.mutateAsync;
    states = state.readinessByProject;
    return null;
  }
  function readState(accessToken = 'test-token') {
    renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <Consumer accessToken={accessToken} />
      </QueryClientProvider>,
    );
    return states;
  }
  function renderHome() {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <DeveloperHomePage
          onSignOut={() => undefined}
          session={{
            accessToken: 'test-token',
            provider: 'github',
            user: { id: 'owner', kind: 'developer', displayName: 'Owner', email: 'owner@example.com' },
          }}
        />
      </QueryClientProvider>,
    );
  }
  async function begin(projectId: string) {
    let ready: () => void = () => undefined;
    const reading = new Promise<void>((resolve) => {
      ready = resolve;
    });
    waiting.set(projectId, ready);
    const pending = requestReadiness(projectId);
    const outcome = pending.then(
      () => null,
      (error: unknown) => error,
    );
    await reading;
    return { pending, outcome };
  }
  readState();
  const first = await begin('A');
  const second = await begin('B');
  assert.deepEqual(readState(), { A: { isPending: true, error: null }, B: { isPending: true, error: null } });
  const bothPending = renderHome();
  for (const projectId of ['A', 'B']) {
    const section =
      bothPending
        .split(`id="developer-project-${projectId}-readiness"`)[1]
        ?.split(`id="developer-project-${projectId}-invite"`)[0] ?? '';
    assert.match(section, /Vérification en cours/);
    assert.doesNotMatch(section, /Dernier résultat|Prêt/);
  }
  responses.get('A')?.(Response.json({ message: 'A unavailable.' }, { status: 503 }));
  assert.match(String(await first.outcome), /A unavailable/);
  assert.match(readState().A?.error ?? '', /A unavailable/);
  assert.equal(readState().B?.isPending, true);
  assert.match(renderHome(), /Vérification de « Project A » impossible/);
  assert.match(renderHome(), /A unavailable/);
  responses.get('B')?.(Response.json({ message: 'B unavailable.' }, { status: 503 }));
  assert.match(String(await second.outcome), /B unavailable/);
  // Retain settled failures even with an aggressive application-level mutation GC policy.
  await new Promise((resolve) => setTimeout(resolve, 1));
  assert.match(readState().A?.error ?? '', /A unavailable/);
  assert.match(readState().B?.error ?? '', /B unavailable/);
  assert.deepEqual(readState('other-identity'), {});
  readState();
  const retryA = await begin('A');
  assert.deepEqual(readState().A, { isPending: true, error: null });
  assert.match(readState().B?.error ?? '', /B unavailable/);
  assert.doesNotMatch(renderHome(), /A unavailable/);
  assert.match(renderHome(), /B unavailable/);
  responses.get('A')?.(Response.json(fresh));
  await retryA.pending;
  assert.deepEqual(readState().A, { isPending: false, error: null });
  assert.match(readState().B?.error ?? '', /B unavailable/);
  assert.deepEqual(queryClient.getQueryData(queryKey), [{ ...projects[0], readiness: fresh }, projects[1]]);
  const retryB = await begin('B');
  responses.get('B')?.(Response.json(fresh));
  await retryB.pending;
  assert.deepEqual(
    queryClient.getQueryData(queryKey),
    projects.map((project) => ({ ...project, readiness: fresh })),
  );
  assert.deepEqual(readState(), { A: { isPending: false, error: null }, B: { isPending: false, error: null } });
});
