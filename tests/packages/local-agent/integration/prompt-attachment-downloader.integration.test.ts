import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import test from 'node:test';
import { PromptAttachmentDownloader } from '../../../../packages/local-agent/src/attachments/prompt-attachment-downloader.js';
import { resolveHarnessTempDirectory } from '../../../../packages/local-agent/src/harness/codex-harness.adapter.js';

test('prompt attachment downloader authenticates, verifies, and writes a private screenshot', async () => {
  const sessionId = '29292929-2929-4929-8929-292929292929';
  const attachmentId = '39393939-3939-4939-8939-393939393939';
  const body = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  let requestedUrl = '';
  let authorization = '';
  const fetchImplementation = (async (input: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(input);
    authorization = new Headers(init?.headers).get('authorization') ?? '';
    return new Response(body, { status: 200 });
  }) as typeof fetch;
  const downloader = new PromptAttachmentDownloader('http://127.0.0.1:3000/', 'agent-secret', fetchImplementation);

  try {
    const paths = await downloader.download(sessionId, [
      {
        id: attachmentId,
        fileName: 'capture.png',
        mimeType: 'image/png',
        byteSize: body.byteLength,
      },
    ]);

    assert.equal(requestedUrl, `http://127.0.0.1:3000/agent/attachments/${attachmentId}`);
    assert.equal(authorization, 'Bearer agent-secret');
    assert.equal(paths.length, 1);
    assert.deepEqual(await readFile(paths[0]), body);
  } finally {
    await rm(resolveHarnessTempDirectory(sessionId), { recursive: true, force: true });
  }
});

test('prompt attachment downloader removes partial files when integrity verification fails', async () => {
  const sessionId = '49494949-4949-4949-8949-494949494949';
  const attachmentId = '59595959-5959-4959-8959-595959595959';
  const fetchImplementation = (async () => new Response(Buffer.from([0x89]), { status: 200 })) as typeof fetch;
  const downloader = new PromptAttachmentDownloader('http://127.0.0.1:3000', undefined, fetchImplementation);

  await assert.rejects(
    downloader.download(sessionId, [
      {
        id: attachmentId,
        fileName: 'capture.png',
        mimeType: 'image/png',
        byteSize: 4,
      },
    ]),
    /unexpected size/,
  );
  await assert.rejects(readFile(`${resolveHarnessTempDirectory(sessionId)}/attachments/${attachmentId}.png`));
});

test('prompt attachment downloader removes private screenshots after the harness no longer needs them', async () => {
  const sessionId = '69696969-6969-4969-8969-696969696969';
  const attachmentId = '79797979-7979-4979-8979-797979797979';
  const body = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  const fetchImplementation = (async () => new Response(body, { status: 200 })) as typeof fetch;
  const downloader = new PromptAttachmentDownloader('http://127.0.0.1:3000', undefined, fetchImplementation);

  const [path] = await downloader.download(sessionId, [
    {
      id: attachmentId,
      fileName: 'capture.png',
      mimeType: 'image/png',
      byteSize: body.byteLength,
    },
  ]);
  await downloader.cleanup(sessionId);

  await assert.rejects(readFile(path));
});
