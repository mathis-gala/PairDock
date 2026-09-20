import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveRendererAsset,
  validateExternalUrl,
  validateRendererUrl,
} from '../../../apps/agent-desktop/src/main/native-policy.js';

test('native privileges and app assets are restricted to the bundled app origin', () => {
  assert.equal(validateRendererUrl('pairdock://app/index.html'), true);
  for (const url of ['https://app/', 'pairdock://app.evil/', 'pairdock://other/', 'file:///tmp/index.html']) {
    assert.equal(validateRendererUrl(url), false);
  }
  assert.equal(resolveRendererAsset('/bundle', 'pairdock://app/assets/main.js'), '/bundle/assets/main.js');
  for (const url of [
    'pairdock://app/%2fetc/passwd',
    'pairdock://app/assets/%2e%2e%2f%2e%2e%2fprivate',
    'pairdock://other/index.html',
    'pairdock://app/%00',
  ]) {
    assert.throws(() => resolveRendererAsset('/bundle', url));
  }
});

test('external navigation never opens file, shell or credential-bearing URLs', () => {
  assert.equal(validateExternalUrl('https://example.test/#/developer'), 'https://example.test/#/developer');
  assert.equal(validateExternalUrl('http://127.0.0.1:5173/'), 'http://127.0.0.1:5173/');
  for (const url of [
    'file:///tmp/test',
    'javascript:alert(1)',
    'http://example.test/',
    'https://user:secret@example.test/',
  ]) {
    assert.throws(() => validateExternalUrl(url));
  }
});
