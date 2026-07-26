import assert from 'node:assert/strict';
import test from 'node:test';
import { GithubWebhookSignatureService } from '../../../../../apps/api/src/github-webhooks/github-webhook-signature.service.js';

test('GitHub webhook signature verification accepts the official HMAC-SHA256 test vector', () => {
  const verifier = new GithubWebhookSignatureService("It's a Secret to Everybody");

  assert.doesNotThrow(() =>
    verifier.verify(
      Buffer.from('Hello, World!'),
      'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
    ),
  );
});
