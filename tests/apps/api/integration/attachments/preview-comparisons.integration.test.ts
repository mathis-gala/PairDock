import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  MAX_PREVIEW_CAPTURE_BYTES,
  MAX_PREVIEW_COMPARISON_CAPTURES,
  MAX_PREVIEW_COMPARISONS,
  PREVIEW_COMPARISON_EVENT,
  previewComparisonCaptureEventSchema,
  previewComparisonSchema,
} from '@pairdock/shared-contracts';
import { z } from 'zod';
import { AppModule } from '../../../../../apps/api/src/app.module.js';
import {
  ATTACHMENT_STORAGE,
  type AttachmentStoragePort,
  type PutAttachmentObjectInput,
} from '../../../../../apps/api/src/attachments/attachment-storage.port.js';
import { DatabaseClient } from '../../../../../apps/api/src/persistence/client.js';
import { authResponseSchema, parseJsonResponse } from '../test-json.js';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);
// The PNG chunks and their CRCs are valid, but the compressed image stream is truncated.
const INVALID_DEFLATE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAACklEQVR42mNk+A8AAQUBFci8VgAAAABJRU5ErkJggg==',
  'base64',
);
const PAGE_CONTEXT = { pageUrl: 'https://preview.example.test/settings', viewport: { width: 1, height: 1 } };
const STORAGE_ENVIRONMENT_KEYS = [
  'PAIRDOCK_ATTACHMENT_STORAGE_PATH',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PRIVATE_BUCKET',
  'R2_PUBLIC_BUCKET',
  'R2_PUBLIC_BASE_URL',
];
const previousStorageEnvironment = new Map(STORAGE_ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]));

let app: INestApplication | undefined;
let baseUrl: string;
let attachmentStoragePath: string;

test.before(async () => {
  attachmentStoragePath = await mkdtemp(join(tmpdir(), 'pairdock-comparison-attachments-'));
  for (const key of STORAGE_ENVIRONMENT_KEYS) process.env[key] = '';
  process.env.PAIRDOCK_ATTACHMENT_STORAGE_PATH = attachmentStoragePath;
  app = await NestFactory.create(AppModule, { logger: ['error'] });
  await app.listen(0);
  const address = app.getHttpServer().address();
  if (!address || typeof address === 'string') throw new Error('Expected an ephemeral HTTP server port.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  await app?.close();
  if (attachmentStoragePath) await rm(attachmentStoragePath, { recursive: true, force: true });
  for (const [key, value] of previousStorageEnvironment) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('a comparison preserves its baseline and earlier captures while displaying the latest after capture', async () => {
  const owner = await authenticateDeveloper();
  const session = await createSession(owner.user.id);
  const baselineResponse = await uploadCapture(session.id, owner.accessToken, { stage: 'before', ...PAGE_CONTEXT });
  assert.equal(baselineResponse.status, 201);
  const baseline = await parseJsonResponse(baselineResponse, previewComparisonSchema);
  assert.equal(baseline.after, null);
  assert.deepEqual(baseline.before.image, { width: 1, height: 1 });

  const firstAfterResponse = await uploadCapture(session.id, owner.accessToken, {
    stage: 'after',
    comparisonId: baseline.id,
    ...PAGE_CONTEXT,
  });
  assert.equal(firstAfterResponse.status, 201);
  const firstAfter = await parseJsonResponse(firstAfterResponse, previewComparisonSchema);
  assert.equal(firstAfter.id, baseline.id);
  assert.equal(firstAfter.before.attachment.id, baseline.before.attachment.id);
  assert.ok(firstAfter.after);

  const latestAfterResponse = await uploadCapture(session.id, owner.accessToken, {
    stage: 'after',
    comparisonId: baseline.id,
    ...PAGE_CONTEXT,
  });
  assert.equal(latestAfterResponse.status, 201);
  const latestAfter = await parseJsonResponse(latestAfterResponse, previewComparisonSchema);
  assert.ok(latestAfter.after);
  assert.notEqual(latestAfter.after.attachment.id, firstAfter.after.attachment.id);

  const listResponse = await fetch(`${baseUrl}/sessions/${session.id}/preview-comparisons`, {
    headers: { authorization: `Bearer ${owner.accessToken}` },
  });
  assert.equal(listResponse.status, 200);
  const comparisons = await parseJsonResponse(listResponse, previewComparisonSchema.array());
  assert.deepEqual(comparisons, [latestAfter]);

  for (const attachmentId of [baseline.before.attachment.id, firstAfter.after.attachment.id]) {
    const download = await fetch(`${baseUrl}/sessions/${session.id}/attachments/${attachmentId}`, {
      headers: { authorization: `Bearer ${owner.accessToken}` },
    });
    assert.equal(download.status, 200);
    assert.equal(download.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), PNG);
  }
});

test('comparison captures require session membership and never become public or cross-session attachments', async () => {
  const owner = await authenticateDeveloper();
  const outsider = await authenticateDeveloper();
  const session = await createSession(owner.user.id);
  const otherSession = await createSession(owner.user.id);
  const baselineResponse = await uploadCapture(session.id, owner.accessToken, { stage: 'before', ...PAGE_CONTEXT });
  assert.equal(baselineResponse.status, 201);
  const baseline = await parseJsonResponse(baselineResponse, previewComparisonSchema);

  for (const caller of [
    { accessToken: undefined, expectedStatus: 401 },
    { accessToken: outsider.accessToken, expectedStatus: 403 },
  ]) {
    const headers = caller.accessToken ? { authorization: `Bearer ${caller.accessToken}` } : undefined;
    const list = await fetch(`${baseUrl}/sessions/${session.id}/preview-comparisons`, { headers });
    assert.equal(list.status, caller.expectedStatus);
    const upload = await uploadCapture(session.id, caller.accessToken, { stage: 'before', ...PAGE_CONTEXT });
    assert.equal(upload.status, caller.expectedStatus);
    const download = await fetch(`${baseUrl}/sessions/${session.id}/attachments/${baseline.before.attachment.id}`, {
      headers,
    });
    assert.equal(download.status, caller.expectedStatus);
  }

  const publicDownload = await fetch(`${baseUrl}/public/attachments/${baseline.before.attachment.id}`);
  assert.equal(publicDownload.status, 404);
  const wrongSessionDownload = await fetch(
    `${baseUrl}/sessions/${otherSession.id}/attachments/${baseline.before.attachment.id}`,
    { headers: { authorization: `Bearer ${owner.accessToken}` } },
  );
  assert.equal(wrongSessionDownload.status, 404);
  const crossSessionAfter = await uploadCapture(otherSession.id, owner.accessToken, {
    stage: 'after',
    comparisonId: baseline.id,
    ...PAGE_CONTEXT,
  });
  assert.equal(crossSessionAfter.status, 404);

  const pmSeed = randomUUID();
  const pmResponse = await fetch(`${baseUrl}/auth/pm/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `slack:${pmSeed}:pairdock-testers:pm-${pmSeed}@pairdock.test:PM ${pmSeed}` }),
  });
  assert.equal(pmResponse.status, 200);
  const pm = await parseJsonResponse(pmResponse, authResponseSchema);
  assert.ok(app);
  await app
    .get(DatabaseClient)
    .sessionMember.create({ data: { sessionId: session.id, userId: pm.user.id, role: 'pm' } });
  const memberAfter = await uploadCapture(session.id, pm.accessToken, {
    stage: 'after',
    comparisonId: baseline.id,
    ...PAGE_CONTEXT,
  });
  assert.equal(memberAfter.status, 201);
  const updated = await parseJsonResponse(memberAfter, previewComparisonSchema);
  assert.ok(updated.after);
  const attachment = await app.get(DatabaseClient).attachment.findUniqueOrThrow({
    where: { id: updated.after.attachment.id },
  });
  assert.equal(attachment.createdByUserId, pm.user.id);
  const memberDownload = await fetch(`${baseUrl}/sessions/${session.id}/attachments/${updated.after.attachment.id}`, {
    headers: { authorization: `Bearer ${pm.accessToken}` },
  });
  assert.equal(memberDownload.status, 200);
});

test('captures validate PNG data and matching page context while closed sessions retain read access', async () => {
  const owner = await authenticateDeveloper();
  const session = await createSession(owner.user.id);
  assert.ok(app);
  const database = app.get(DatabaseClient);
  await database.session.update({ where: { id: session.id }, data: { previewUrl: PAGE_CONTEXT.pageUrl } });
  const context = { ...PAGE_CONTEXT, viewport: { width: 1280, height: 720 } };
  const baselineResponse = await uploadCapture(session.id, owner.accessToken, { stage: 'before', ...context });
  assert.equal(baselineResponse.status, 201, 'PNG pixels need not equal the CSS viewport dimensions');
  const baseline = await parseJsonResponse(baselineResponse, previewComparisonSchema);
  const after = { stage: 'after', comparisonId: baseline.id, ...context };
  const twoPixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAAAAADRSSBWAAAAC0lEQVR4nGNg+A8AAQIBAEK+vGgAAAAASUVORK5CYII=',
    'base64',
  );
  const corruptPng = Buffer.from(PNG);
  corruptPng[29] ^= 1;
  for (const invalid of [
    { input: { ...after, pageUrl: 'https://preview.example.test/other' } },
    { input: { ...after, viewport: { width: 1024, height: 720 } } },
    { input: after, bytes: twoPixelPng },
    { input: after, bytes: corruptPng },
    { input: after, bytes: INVALID_DEFLATE_PNG },
    { input: after, bytes: Buffer.from('not a PNG') },
    { input: after, mimeType: 'image/jpeg' },
    { input: { stage: 'before', ...context, pageUrl: 'https://elsewhere.example.test/settings' } },
    { input: { stage: 'before', ...context, pageUrl: `${context.pageUrl}?token=secret` } },
    { input: { stage: 'before', ...context, comparisonId: randomUUID() } },
  ]) {
    const response = await uploadCapture(session.id, owner.accessToken, invalid.input, invalid.bytes, invalid.mimeType);
    assert.equal(response.status, 400);
  }
  const unknownComparison = await uploadCapture(session.id, owner.accessToken, {
    ...after,
    comparisonId: randomUUID(),
  });
  assert.equal(unknownComparison.status, 404);
  const oversized = await uploadCapture(
    session.id,
    owner.accessToken,
    after,
    Buffer.alloc(MAX_PREVIEW_CAPTURE_BYTES + 1),
  );
  assert.equal(oversized.status, 413);
  assert.equal(await database.attachment.count({ where: { sessionId: session.id } }), 1);
  assert.equal(await database.agentEvent.count({ where: { sessionId: session.id } }), 1);

  for (const status of ['AGENT_RUNNING', 'CLOSED'] as const) {
    await database.session.update({ where: { id: session.id }, data: { status } });
    const rejected = await uploadCapture(session.id, owner.accessToken, after);
    assert.equal(rejected.status, 409);
    const invalidCapture = await uploadCapture(session.id, owner.accessToken, after, INVALID_DEFLATE_PNG);
    assert.equal(invalidCapture.status, 409, 'busy sessions must be rejected before PNG decompression');
    const list = await fetch(`${baseUrl}/sessions/${session.id}/preview-comparisons`, {
      headers: { authorization: `Bearer ${owner.accessToken}` },
    });
    assert.equal(list.status, 200);
    assert.deepEqual(await parseJsonResponse(list, previewComparisonSchema.array()), [baseline]);
  }
  for (const status of ['AWAITING_PM_VALIDATION', 'FAILED'] as const) {
    await database.session.update({ where: { id: session.id }, data: { status } });
    const accepted = await uploadCapture(session.id, owner.accessToken, after);
    assert.equal(accepted.status, 201);
  }
});

test('concurrent captures respect both session limits and the latest capture follows append order rather than timestamps', async () => {
  const owner = await authenticateDeveloper();
  const session = await createSession(owner.user.id);
  let firstComparisonId: string | undefined;
  for (let index = 0; index < MAX_PREVIEW_COMPARISONS - 1; index += 1) {
    const response = await uploadCapture(session.id, owner.accessToken, { stage: 'before', ...PAGE_CONTEXT });
    assert.equal(response.status, 201);
    const comparison = await parseJsonResponse(response, previewComparisonSchema);
    firstComparisonId ??= comparison.id;
  }
  const lastBaselineRace = await Promise.all([
    uploadCapture(session.id, owner.accessToken, { stage: 'before', ...PAGE_CONTEXT }),
    uploadCapture(session.id, owner.accessToken, { stage: 'before', ...PAGE_CONTEXT }),
  ]);
  assert.deepEqual(lastBaselineRace.map((response) => response.status).sort(), [201, 409]);
  const excessBaseline = await uploadCapture(
    session.id,
    owner.accessToken,
    { stage: 'before', ...PAGE_CONTEXT },
    INVALID_DEFLATE_PNG,
  );
  assert.equal(excessBaseline.status, 409, 'the comparison limit must be checked before PNG decompression');
  assert.ok(firstComparisonId);
  const after = { stage: 'after', comparisonId: firstComparisonId, ...PAGE_CONTEXT };
  const acceptedRace = await Promise.all([
    uploadCapture(session.id, owner.accessToken, after),
    uploadCapture(session.id, owner.accessToken, after),
  ]);
  assert.deepEqual(
    acceptedRace.map((response) => response.status),
    [201, 201],
  );
  for (
    let count = MAX_PREVIEW_COMPARISONS + acceptedRace.length;
    count < MAX_PREVIEW_COMPARISON_CAPTURES - 1;
    count += 1
  ) {
    const response = await uploadCapture(session.id, owner.accessToken, after);
    assert.equal(response.status, 201);
  }
  const lastCaptureRace = await Promise.all([
    uploadCapture(session.id, owner.accessToken, after),
    uploadCapture(session.id, owner.accessToken, after),
  ]);
  assert.deepEqual(lastCaptureRace.map((response) => response.status).sort(), [201, 409]);
  const accepted = lastCaptureRace.find((response) => response.status === 201);
  assert.ok(accepted);
  const finalCapture = await parseJsonResponse(accepted, previewComparisonSchema);
  assert.ok(finalCapture.after);
  const excessCapture = await uploadCapture(session.id, owner.accessToken, after, INVALID_DEFLATE_PNG);
  assert.equal(excessCapture.status, 409, 'the total capture limit must be checked before PNG decompression');

  assert.ok(app);
  const database = app.get(DatabaseClient);
  const records = await database.agentEvent.findMany({
    where: { sessionId: session.id, type: PREVIEW_COMPARISON_EVENT },
  });
  assert.equal(records.length, MAX_PREVIEW_COMPARISON_CAPTURES);
  assert.ok(records.every((record) => record.agentId === null));
  const captures = records
    .map((record) => ({
      id: record.id,
      ...previewComparisonCaptureEventSchema
        .extend({ captureSequence: z.number().int().positive() })
        .parse(record.payload),
    }))
    .sort((left, right) => left.captureSequence - right.captureSequence);
  assert.deepEqual(
    captures.map((capture) => capture.captureSequence),
    Array.from({ length: MAX_PREVIEW_COMPARISON_CAPTURES }, (_, index) => index + 1),
  );
  const latest = captures.at(-1);
  const previous = captures.at(-2);
  assert.ok(latest && previous);
  assert.equal(latest.attachmentId, finalCapture.after.attachment.id);
  await database.agentEvent.update({
    where: { id: latest.id },
    data: { createdAt: new Date('2000-01-01T00:00:00.000Z') },
  });
  await database.agentEvent.update({
    where: { id: previous.id },
    data: { createdAt: new Date('2099-01-01T00:00:00.000Z') },
  });
  const list = await fetch(`${baseUrl}/sessions/${session.id}/preview-comparisons`, {
    headers: { authorization: `Bearer ${owner.accessToken}` },
  });
  assert.equal(list.status, 200);
  const comparisons = await parseJsonResponse(list, previewComparisonSchema.array());
  assert.equal(comparisons.length, MAX_PREVIEW_COMPARISONS);
  assert.equal(
    comparisons.find((comparison) => comparison.id === firstComparisonId)?.after?.attachment.id,
    latest.attachmentId,
  );
  assert.equal(await database.attachment.count({ where: { sessionId: session.id } }), MAX_PREVIEW_COMPARISON_CAPTURES);
});

test('a session that starts running during upload rejects the capture and removes its stored attachment', async (context) => {
  const owner = await authenticateDeveloper();
  const session = await createSession(owner.user.id);
  assert.ok(app);
  const database = app.get(DatabaseClient);
  const storage = app.get<AttachmentStoragePort>(ATTACHMENT_STORAGE);
  const originalPut = storage.put.bind(storage);
  let uploadedObjectKey: string | undefined;
  const put = context.mock.method(storage, 'put', async (input: PutAttachmentObjectInput) => {
    await originalPut(input);
    uploadedObjectKey = input.objectKey;
    await database.session.update({ where: { id: session.id }, data: { status: 'AGENT_RUNNING' } });
  });
  try {
    const response = await uploadCapture(session.id, owner.accessToken, { stage: 'before', ...PAGE_CONTEXT });
    assert.equal(response.status, 409);
  } finally {
    put.mock.restore();
  }
  assert.ok(uploadedObjectKey);
  assert.equal(await database.attachment.count({ where: { sessionId: session.id } }), 0);
  assert.equal(await database.agentEvent.count({ where: { sessionId: session.id } }), 0);
  await assert.rejects(storage.read('private', uploadedObjectKey), { code: 'ENOENT' });
  const list = await fetch(`${baseUrl}/sessions/${session.id}/preview-comparisons`, {
    headers: { authorization: `Bearer ${owner.accessToken}` },
  });
  assert.equal(list.status, 200);
  assert.deepEqual(await parseJsonResponse(list, previewComparisonSchema.array()), []);
});

async function authenticateDeveloper() {
  const seed = randomUUID();
  const response = await fetch(`${baseUrl}/auth/developer/callback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ accessToken: `github:${seed}:dev-${seed}@pairdock.test:Developer ${seed}` }),
  });
  assert.equal(response.status, 200);
  return parseJsonResponse(response, authResponseSchema);
}

async function createSession(ownerUserId: string) {
  assert.ok(app);
  const database = app.get(DatabaseClient);
  const connection = await database.sourceControlConnection.create({
    data: { ownerUserId, providerConnectionId: `test-${randomUUID()}`, accountLogin: 'comparison-owner' },
  });
  const project = await database.project.create({
    data: {
      ownerUserId,
      sourceControlConnectionId: connection.id,
      name: 'Comparison project',
      repoFullName: 'pairdock/comparisons',
      defaultBranch: 'main',
      agentProjectKey: `comparison-${randomUUID()}`,
    },
  });
  return database.session.create({
    data: {
      projectId: project.id,
      createdByUserId: ownerUserId,
      status: 'READY',
      modelId: 'codex/gpt-5',
      members: { create: { userId: ownerUserId, role: 'developer' } },
    },
  });
}

function uploadCapture(
  sessionId: string,
  accessToken: string | undefined,
  input: unknown,
  bytes = PNG,
  mimeType = 'image/png',
) {
  const form = new FormData();
  form.append('metadata', JSON.stringify(input));
  form.append('screenshot', new Blob([new Uint8Array(bytes)], { type: mimeType }), 'capture.png');
  return fetch(`${baseUrl}/sessions/${sessionId}/preview-comparisons`, {
    method: 'POST',
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
    body: form,
  });
}
