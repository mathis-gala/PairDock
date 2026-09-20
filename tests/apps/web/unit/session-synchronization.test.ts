import assert from 'node:assert/strict';
import test from 'node:test';
import { uiSessionEventName, uiSessionSubscribedEventName } from '@pairdock/shared-contracts';
import { type SessionSocket, SessionSynchronization } from '../../../../apps/web/src/lib/session-synchronization.js';
import type { SessionMessageView, SessionView } from '../../../../apps/web/src/schemas/session.js';

const sessionId = '11111111-1111-4111-8111-111111111111';

class TestSocket implements SessionSocket {
  readonly listeners = new Map<string, () => void>();
  disconnected = false;

  on(event: string, listener: () => void) {
    this.listeners.set(event, listener);
  }

  emit() {}

  receive(event: string) {
    this.listeners.get(event)?.();
  }

  removeAllListeners() {
    this.listeners.clear();
  }

  disconnect() {
    this.disconnected = true;
  }
}

const session: SessionView = {
  id: sessionId,
  projectId: sessionId,
  createdByUserId: sessionId,
  status: 'READY',
  modelId: 'test-model',
  reasoningEffort: 'medium',
  branchName: 'feat/test',
  worktreeRef: null,
  previewUrl: null,
  lastError: null,
  project: {
    id: sessionId,
    name: 'Test project',
    defaultBranch: 'main',
    ownerDisplayName: 'Developer',
    owningAgentId: 'test-agent',
    agentAvailability: 'online',
  },
  participants: [],
  latestDiff: null,
  latestValidation: null,
  createdAt: '2026-09-20T10:00:00.000Z',
  closedAt: null,
};

const sentMessage: SessionMessageView = {
  id: '22222222-2222-4222-8222-222222222222',
  sessionId,
  userId: sessionId,
  role: 'pm',
  content: 'Corrige le bouton.',
  attachments: [],
  createdAt: '2026-09-20T10:01:00.000Z',
};

async function eventually(predicate: () => boolean) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  assert.ok(predicate(), 'Expected synchronized session state');
}

async function createQueryClient() {
  // Match the app's ESM QueryClient, including its private-field type identity.
  const { QueryClient } = await import('@tanstack/react-query');
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

test('a Session catches up after resubscription without waiting for another event', async (context) => {
  let currentSession = session;
  context.mock.method(globalThis, 'fetch', async (url: string) => {
    const value = url.endsWith(`/sessions/${sessionId}`) ? currentSession : [];
    return Response.json(value);
  });
  const queryClient = await createQueryClient();
  const socket = new TestSocket();
  const synchronization = new SessionSynchronization(queryClient, 'pm-token', sessionId, () => socket);
  const unsubscribe = synchronization.subscribe(() => undefined);
  try {
    await eventually(() => synchronization.getSnapshot().status === 'ready');
    socket.receive('connect');
    socket.receive(uiSessionSubscribedEventName);
    await eventually(() => queryClient.isFetching() === 0);
    const beforeDisconnect = synchronization.getSnapshot();
    currentSession = { ...session, status: 'AWAITING_PM_VALIDATION' };
    socket.receive('disconnect');
    socket.receive('connect');
    socket.receive(uiSessionSubscribedEventName);
    await eventually(() => {
      const snapshot = synchronization.getSnapshot();
      return snapshot.status === 'ready' && snapshot.session.status === 'AWAITING_PM_VALIDATION';
    });
    assert.notEqual(synchronization.getSnapshot(), beforeDisconnect);
    assert.equal(beforeDisconnect.status === 'ready' && beforeDisconnect.session.status, 'READY');
    assert.equal(synchronization.getSnapshot(), synchronization.getSnapshot());
  } finally {
    unsubscribe();
    queryClient.clear();
  }
});

test('the first subscription supersedes an initial read taken before the Session joined', async (context) => {
  let reads = 0;
  let completeInitialRead: (response: Response) => void = () => assert.fail('No initial read');
  context.mock.method(globalThis, 'fetch', async (url: string) => {
    if (!url.endsWith(`/sessions/${sessionId}`)) return Response.json([]);
    reads += 1;
    if (reads === 1) {
      return new Promise<Response>((resolve) => {
        completeInitialRead = resolve;
      });
    }
    return Response.json({ ...session, status: 'AWAITING_PM_VALIDATION' });
  });
  const queryClient = await createQueryClient();
  const socket = new TestSocket();
  const synchronization = new SessionSynchronization(queryClient, 'pm-token', sessionId, () => socket);
  const unsubscribe = synchronization.subscribe(() => undefined);
  try {
    await eventually(() => reads === 1);
    socket.receive('connect');
    socket.receive(uiSessionSubscribedEventName);
    socket.receive(uiSessionEventName);
    socket.receive(uiSessionEventName);
    completeInitialRead(Response.json(session));
    await eventually(() => reads > 1 && queryClient.isFetching() === 0);
    const snapshot = synchronization.getSnapshot();
    assert.equal(snapshot.status === 'ready' && snapshot.session.status, 'AWAITING_PM_VALIDATION');
  } finally {
    unsubscribe();
    queryClient.clear();
  }
});

test('a prompt appears once when its event refresh completes before the send response', async (context) => {
  let messages: SessionMessageView[] = [];
  let completeSend: (response: Response) => void = () => assert.fail('Prompt was not sent');
  context.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('/prompts')) {
      messages = [sentMessage];
      return new Promise<Response>((resolve) => {
        completeSend = resolve;
      });
    }
    if (url.endsWith('/messages')) return Response.json(messages);
    return Response.json(url.endsWith(`/sessions/${sessionId}`) ? session : []);
  });
  const queryClient = await createQueryClient();
  const socket = new TestSocket();
  const synchronization = new SessionSynchronization(queryClient, 'pm-token', sessionId, () => socket);
  const unsubscribe = synchronization.subscribe(() => undefined);
  try {
    await eventually(() => synchronization.getSnapshot().status === 'ready');
    const sending = synchronization.sendPrompt({ content: sentMessage.content, screenshots: [] });
    socket.receive(uiSessionEventName);
    await eventually(() => {
      const snapshot = synchronization.getSnapshot();
      return snapshot.status === 'ready' && snapshot.conversation.length === 1;
    });
    completeSend(Response.json(sentMessage));
    await sending;
    const snapshot = synchronization.getSnapshot();
    assert.equal(snapshot.status === 'ready' && snapshot.conversation.length, 1);
  } finally {
    unsubscribe();
    queryClient.clear();
  }
});

test('a confirmed prompt survives an older event refresh and catches up without another event', async (context) => {
  let messages: SessionMessageView[] = [];
  let delayMessages = false;
  let hasPendingRead = false;
  let completeOlderRead: (response: Response) => void = () => assert.fail('No older read');
  context.mock.method(globalThis, 'fetch', async (url: string) => {
    if (url.endsWith('/prompts')) {
      messages = [
        sentMessage,
        { ...sentMessage, id: '33333333-3333-4333-8333-333333333333', role: 'assistant', content: 'Terminé.' },
      ];
      return Response.json(sentMessage);
    }
    if (url.endsWith('/messages')) {
      if (delayMessages) {
        delayMessages = false;
        hasPendingRead = true;
        return new Promise<Response>((resolve) => {
          completeOlderRead = resolve;
        });
      }
      return Response.json(messages);
    }
    return Response.json(url.endsWith(`/sessions/${sessionId}`) ? session : []);
  });
  const queryClient = await createQueryClient();
  const socket = new TestSocket();
  const synchronization = new SessionSynchronization(queryClient, 'pm-token', sessionId, () => socket);
  const unsubscribe = synchronization.subscribe(() => undefined);
  try {
    await eventually(() => synchronization.getSnapshot().status === 'ready');
    delayMessages = true;
    socket.receive(uiSessionEventName);
    await eventually(() => hasPendingRead);
    await synchronization.sendPrompt({ content: sentMessage.content, screenshots: [] });
    completeOlderRead(Response.json([]));
    await eventually(() => {
      const snapshot = synchronization.getSnapshot();
      return snapshot.status === 'ready' && snapshot.conversation.length === 2;
    });
    const snapshot = synchronization.getSnapshot();
    assert.equal(snapshot.status === 'ready' && snapshot.conversation.length, 2);
  } finally {
    unsubscribe();
    queryClient.clear();
  }
});

test('Session synchronization isolates both authenticated identities and QueryClient lifetimes', async (context) => {
  let revision = 1;
  context.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    const identity = new Headers(options.headers).get('authorization');
    const value = {
      ...session,
      project: { ...session.project, name: `${identity} project ${revision}` },
    };
    return Response.json(url.endsWith(`/sessions/${sessionId}`) ? value : []);
  });
  const firstClient = await createQueryClient();
  const secondClient = await createQueryClient();
  const firstSocket = new TestSocket();
  const otherIdentitySocket = new TestSocket();
  const otherClientSocket = new TestSocket();
  const first = new SessionSynchronization(firstClient, 'first-token', sessionId, () => firstSocket);
  const otherIdentity = new SessionSynchronization(firstClient, 'second-token', sessionId, () => otherIdentitySocket);
  const otherClient = new SessionSynchronization(secondClient, 'first-token', sessionId, () => otherClientSocket);
  const stores = [first, otherIdentity, otherClient];
  const releases = stores.map((store) => store.subscribe(() => undefined));
  try {
    await eventually(() => stores.every((store) => store.getSnapshot().status === 'ready'));
    const otherIdentityBefore = otherIdentity.getSnapshot();
    const otherClientBefore = otherClient.getSnapshot();
    assert.equal(
      otherIdentityBefore.status === 'ready' && otherIdentityBefore.session.project.name,
      'Bearer second-token project 1',
    );
    revision = 2;
    firstSocket.receive(uiSessionEventName);
    await eventually(() => {
      const snapshot = first.getSnapshot();
      return snapshot.status === 'ready' && snapshot.session.project.name === 'Bearer first-token project 2';
    });
    assert.equal(otherIdentity.getSnapshot(), otherIdentityBefore);
    assert.equal(otherClient.getSnapshot(), otherClientBefore);
    otherClientSocket.receive(uiSessionSubscribedEventName);
    await eventually(() => {
      const snapshot = otherClient.getSnapshot();
      return snapshot.status === 'ready' && snapshot.session.project.name === 'Bearer first-token project 2';
    });
  } finally {
    for (const release of releases) release();
    firstClient.clear();
    secondClient.clear();
  }
});

test('the last Session subscriber releases transport and queries, and a later mount reconnects', async (context) => {
  let requests = 0;
  context.mock.method(globalThis, 'fetch', async (url: string) => {
    requests += 1;
    return Response.json(url.endsWith(`/sessions/${sessionId}`) ? session : []);
  });
  const queryClient = await createQueryClient();
  const sockets: TestSocket[] = [];
  const synchronization = new SessionSynchronization(queryClient, 'pm-token', sessionId, () => {
    const socket = new TestSocket();
    sockets.push(socket);
    return socket;
  });
  const releaseFirst = synchronization.subscribe(() => undefined);
  const releaseSecond = synchronization.subscribe(() => undefined);
  try {
    await eventually(() => synchronization.getSnapshot().status === 'ready');
    releaseFirst();
    assert.equal(sockets[0].disconnected, false);
    const requestsBeforeRelease = requests;
    sockets[0].receive(uiSessionSubscribedEventName);
    releaseSecond();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(requests, requestsBeforeRelease, 'a queued refresh cannot start reads after release');
    assert.equal(sockets[0].disconnected, true);
    assert.equal(sockets[0].listeners.size, 0);
    assert.ok(
      queryClient
        .getQueryCache()
        .getAll()
        .every((query) => query.getObserversCount() === 0),
    );
    const requestsAfterRelease = requests;
    sockets[0].receive(uiSessionEventName);
    assert.equal(requests, requestsAfterRelease);

    const releaseRemount = synchronization.subscribe(() => undefined);
    try {
      assert.equal(sockets.length, 2);
      sockets[1].receive('connect');
      sockets[1].receive(uiSessionSubscribedEventName);
      await eventually(() => requests > requestsAfterRelease && queryClient.isFetching() === 0);
      assert.equal(synchronization.getSnapshot().status, 'ready');
      assert.ok(requests > requestsAfterRelease);
    } finally {
      releaseRemount();
    }
    assert.equal(sockets[1].disconnected, true);
  } finally {
    releaseFirst();
    releaseSecond();
    queryClient.clear();
  }
});
