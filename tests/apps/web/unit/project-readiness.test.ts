import assert from 'node:assert/strict';
import test from 'node:test';
import { createApiClient } from '../../../../apps/web/src/api/client.js';
import { requestProjectReadiness } from '../../../../apps/web/src/lib/project-readiness.js';

test('readiness waits past the acknowledgement and unchanged results, then accepts a fresh server timestamp', async (context) => {
  const previous = { ok: true, checks: [], updatedAt: '2026-09-20T10:00:00.000Z' };
  const fresh = { ...previous, updatedAt: '2026-09-20T10:00:01.000Z' };
  const requests: string[] = [];
  let reads = 0;
  let complete: (response: Response) => void = () => assert.fail('Final read was not reached.');
  let finalRead: () => void = () => undefined;
  const reachedFinalRead = new Promise<void>((resolve) => {
    finalRead = resolve;
  });
  context.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, options?: RequestInit) => {
    requests.push(`${options?.method} ${new URL(String(input)).pathname}`);
    assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer test-token');
    if (options?.method === 'POST') return Response.json({ requested: true }, { status: 202 });
    reads += 1;
    if (reads <= 2) return Response.json(previous);
    finalRead();
    return new Promise<Response>((resolve) => {
      complete = resolve;
    });
  });

  let settled = false;
  const pending = requestProjectReadiness(createApiClient('test-token').projects, 'project-1', {
    pollIntervalMs: 0,
  }).then((value) => {
    settled = true;
    return value;
  });
  await reachedFinalRead;
  assert.equal(settled, false, 'The acknowledgement and previous snapshot must not finish the check.');
  complete(Response.json(fresh));
  assert.deepEqual(await pending, fresh);
  assert.deepEqual(requests, [
    'GET /tool-readiness/projects/project-1',
    'POST /tool-readiness/projects/project-1/check',
    'GET /tool-readiness/projects/project-1',
    'GET /tool-readiness/projects/project-1',
  ]);
});

test('a failed acknowledgement preserves the server error and never starts polling', async (context) => {
  const methods: string[] = [];
  context.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, options?: RequestInit) => {
    methods.push(options?.method ?? '');
    if (options?.method === 'GET') return Response.json(null);
    return Response.json({ message: 'Agent unavailable.' }, { status: 503 });
  });
  await assert.rejects(
    requestProjectReadiness(createApiClient('test-token').projects, 'project-1'),
    /La vérification n’a pas pu aboutir\. Agent unavailable\./,
  );
  assert.deepEqual(methods, ['GET', 'POST']);
});

test('cancellation during the baseline request aborts HTTP and never sends the check later', async (context) => {
  const controller = new AbortController();
  const cancelled = new Error('Cancelled by caller.');
  let finishRead: (response: Response) => void = () => assert.fail('Read did not start.');
  const methods: string[] = [];
  let requestSignal: AbortSignal | null | undefined;
  context.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, options?: RequestInit) => {
    requestSignal = options?.signal;
    methods.push(options?.method ?? '');
    return new Promise<Response>((resolve) => {
      finishRead = resolve;
    });
  });
  const pending = requestProjectReadiness(createApiClient('test-token').projects, 'project-1', {
    signal: controller.signal,
  });
  controller.abort(cancelled);
  await assert.rejects(pending, cancelled);
  assert.equal(requestSignal?.aborted, true);
  finishRead(Response.json(null));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(methods, ['GET']);
});

test('readiness rejects malformed server timestamps instead of treating unversioned results as fresh', async (context) => {
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async () => {
    requests += 1;
    return Response.json({ ok: true, checks: [], updatedAt: 'not-a-date' });
  });
  await assert.rejects(requestProjectReadiness(createApiClient('test-token').projects, 'project-1'), /updatedAt/);
  assert.equal(requests, 1);
});

test('readiness times out even when HTTP stalls, aborts it, and permits a subsequent retry', {
  timeout: 500,
}, async (context) => {
  let requestSignal: AbortSignal | null | undefined;
  const fresh = { ok: true, checks: [], updatedAt: '2026-09-20T10:00:01.000Z' };
  let stalled = true;
  let reads = 0;
  context.mock.method(globalThis, 'fetch', async (_input: RequestInfo | URL, options?: RequestInit) => {
    requestSignal = options?.signal;
    if (stalled) return new Promise<Response>(() => undefined);
    if (options?.method === 'POST') return Response.json({ requested: true }, { status: 202 });
    reads += 1;
    return Response.json(reads === 1 ? null : fresh);
  });
  const api = createApiClient('test-token').projects;
  await assert.rejects(requestProjectReadiness(api, 'project-1', { timeoutMs: 10 }), /réessayez/);
  assert.equal(requestSignal?.aborted, true);
  stalled = false;
  assert.deepEqual(await requestProjectReadiness(api, 'project-1'), fresh);
});
