import assert from 'node:assert/strict';
import test from 'node:test';
import { QueuedNotificationAdapter } from '../../../../../apps/api/src/notifications/adapters/queued-notification.adapter.js';

test('QueuedNotificationAdapter records notification intent without linking Slack delivery', async () => {
  const adapter = new QueuedNotificationAdapter();
  const result = await adapter.send();

  assert.deepEqual(result, {
    provider: null,
    providerMessageId: null,
    status: 'queued',
  });
});
