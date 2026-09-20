import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDesktopError } from '../../../apps/agent-desktop/src/renderer/display-error.js';

test('Electron transport prefixes are removed while the actual failure remains intact', () => {
  const detail = 'The profile could not be unlocked.\nRestore system keychain access and retry.';
  assert.equal(formatDesktopError(`Error invoking remote method 'agent:initialize': Error: ${detail}`), detail);
  assert.equal(formatDesktopError(`Error invoking remote method 'agent:initialize': ${detail}`), detail);
});

test('insecure server URLs get the same actionable French message from IPC and snapshot errors', () => {
  const failure = 'backendUrl must use HTTPS, except for an HTTP loopback address, and must not contain credentials.';
  const message = formatDesktopError(failure);
  assert.equal(formatDesktopError(`Error invoking remote method 'agent:pair': Error: ${failure}`), message);
  assert.match(message ?? '', /Utilise une adresse HTTPS sans identifiant ni mot de passe/);
  assert.match(message ?? '', /localhost, 127\.0\.0\.1 ou \[::1\]/);
});

test('unrecognized failures and empty Electron failures are not hidden', () => {
  const detail = 'Error: Could not start project preview.';
  assert.equal(formatDesktopError(detail), detail);
  const emptyFailure = "Error invoking remote method 'agent:start': Error: ";
  assert.equal(formatDesktopError(emptyFailure), emptyFailure);
});
