import assert from 'node:assert/strict';
import test from 'node:test';
import { LogRedactor } from '../../../../packages/local-agent/src/logging/redactor.js';

test('BT-022: LogRedactor replaces apparent tokens before transmission', () => {
  const redactor = new LogRedactor();
  const original = 'Authorization: Bearer super-secret-token\nAPI_TOKEN=TOP_SECRET_VALUE\n';

  const redacted = redactor.redact(original);

  assert.match(redacted, /Bearer \[REDACTED\]/);
  assert.match(redacted, /API_TOKEN=\[REDACTED\]/);
  assert.doesNotMatch(redacted, /super-secret-token/);
  assert.doesNotMatch(redacted, /TOP_SECRET_VALUE/);
});
