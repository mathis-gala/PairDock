import assert from 'node:assert/strict';
import test from 'node:test';
import { PREVIEW_SELECTION_CHANNEL, type PreviewElementSelection } from '@pairdock/shared-contracts';
import { PreviewSelectionBridge } from '../../../../apps/web/src/lib/preview-selection-bridge.js';

const selection: PreviewElementSelection = {
  tagName: 'button',
  selector: '#save',
  text: 'Enregistrer',
  html: '<button id="save">Enregistrer</button>',
  url: 'https://preview.example/settings',
  rect: { x: 10, y: 20, width: 100, height: 40 },
  viewport: { width: 1280, height: 800 },
};

function createFrame() {
  const host = new EventTarget();
  const commands: { message: { type: string; nonce: string; enabled?: boolean }; origin: string }[] = [];
  const frame = Object.assign(new EventTarget(), {
    ownerDocument: { defaultView: host },
    contentWindow: {
      postMessage(message: { type: string; nonce: string; enabled?: boolean }, origin: string) {
        commands.push({ message, origin });
      },
    },
  });

  function receive(data: unknown, origin = 'https://preview.example', source: unknown = frame.contentWindow) {
    host.dispatchEvent(Object.assign(new Event('message'), { data, origin, source }));
  }

  // The browser supplies this DOM boundary; the test only needs its event and message APIs.
  return { frame: frame as unknown as HTMLIFrameElement, host, commands, receive };
}

test('only an active selection from the connected frame, origin and nonce reaches the draft', () => {
  const fixture = createFrame();
  const received: PreviewElementSelection[] = [];
  const bridge = new PreviewSelectionBridge('https://preview.example', true, (item) => received.push(item));
  bridge.attachFrame(fixture.frame);
  try {
    const nonce = fixture.commands[0].message.nonce;
    const envelope = { channel: PREVIEW_SELECTION_CHANNEL, nonce };
    fixture.receive({ ...envelope, type: 'ready' });
    assert.equal(bridge.getSnapshot().status, 'ready');
    fixture.receive({ ...envelope, type: 'selected', selection });
    assert.equal(received.length, 0, 'unsolicited selection is ignored');

    bridge.toggleSelection();
    fixture.receive({ ...envelope, type: 'selected', selection }, 'https://attacker.example');
    fixture.receive({ ...envelope, type: 'selected', selection }, 'https://preview.example', {});
    fixture.receive({ ...envelope, nonce: 'stale', type: 'selected', selection });
    fixture.receive({ ...envelope, type: 'selected', selection: { ...selection, url: 'javascript:alert(1)' } });
    for (const url of ['', 'bogus', 'https://[bad/', 'https://preview.example/?token=private']) {
      fixture.receive({ ...envelope, type: 'selected', selection: { ...selection, url } });
    }
    assert.equal(received.length, 0);

    fixture.receive({ ...envelope, type: 'selected', selection });
    assert.deepEqual(received, [selection]);
    assert.equal(bridge.getSnapshot().isSelecting, false);
    fixture.receive({ ...envelope, type: 'selected', selection });
    assert.equal(received.length, 1, 'duplicate delivery cannot attach twice');
    assert.ok(fixture.commands.every((command) => command.origin === 'https://preview.example'));
  } finally {
    bridge.attachFrame(null);
  }
});

test('handshake retries expose unsupported pages and navigation invalidates the previous document', (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const fixture = createFrame();
  const received: PreviewElementSelection[] = [];
  const bridge = new PreviewSelectionBridge('https://preview.example', true, (item) => received.push(item));
  bridge.attachFrame(fixture.frame);
  try {
    const oldNonce = fixture.commands[0].message.nonce;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      context.mock.timers.tick(500);
    }
    assert.ok(fixture.commands.length > 1, 'missed initial script readiness is retried');
    assert.equal(bridge.getSnapshot().status, 'unsupported');

    fixture.frame.dispatchEvent(new Event('load'));
    const nonce = fixture.commands.at(-1)?.message.nonce;
    assert.notEqual(nonce, oldNonce);
    fixture.receive({ channel: PREVIEW_SELECTION_CHANNEL, type: 'ready', nonce: oldNonce });
    assert.equal(bridge.getSnapshot().status, 'connecting');
    fixture.receive({ channel: PREVIEW_SELECTION_CHANNEL, type: 'ready', nonce });
    bridge.toggleSelection();
    fixture.receive({ channel: PREVIEW_SELECTION_CHANNEL, type: 'selected', nonce: oldNonce, selection });
    assert.equal(received.length, 0);

    fixture.host.dispatchEvent(Object.assign(new Event('keydown'), { key: 'Escape' }));
    assert.equal(bridge.getSnapshot().isSelecting, false);
    assert.equal(fixture.commands.at(-1)?.message.enabled, false);
  } finally {
    bridge.attachFrame(null);
  }
  const commandCount = fixture.commands.length;
  context.mock.timers.tick(10_000);
  assert.equal(fixture.commands.length, commandCount, 'detached previews release retry timers');
});

test('read-only previews never connect or accept selections', () => {
  const fixture = createFrame();
  const bridge = new PreviewSelectionBridge('https://preview.example', false, () => assert.fail('read-only'));
  bridge.attachFrame(fixture.frame);
  bridge.connect();
  bridge.toggleSelection();
  assert.equal(fixture.commands.length, 0);
  bridge.attachFrame(null);
});
