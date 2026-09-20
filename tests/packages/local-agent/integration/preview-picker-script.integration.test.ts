import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import {
  PREVIEW_SELECTION_CHANNEL,
  type PreviewSelectionMessage,
  previewSelectionMessageSchema,
} from '@pairdock/shared-contracts';
import { getPreviewPickerScript } from '../../../../packages/local-agent/src/preview/preview-picker-script.js';

function createPickerBrowser(topLevel = false) {
  const listeners = new Map<string, Array<(event: unknown) => void>>();
  const sent: Array<{ message: PreviewSelectionMessage; targetOrigin: string }> = [];
  const parent = {
    postMessage(message: unknown, targetOrigin: string) {
      sent.push({ message: previewSelectionMessageSchema.parse(message), targetOrigin });
    },
  };
  const window = {
    parent: topLevel ? undefined : parent,
    location: { protocol: 'https:', origin: 'https://preview.example', pathname: '/' },
    addEventListener(name: string, listener: (event: unknown) => void) {
      listeners.set(name, [...(listeners.get(name) ?? []), listener]);
    },
    cancelAnimationFrame() {},
    innerWidth: 1280,
    innerHeight: 720,
  };
  const contextWindow = topLevel ? { ...window, parent: window } : window;
  if (topLevel) {
    Object.assign(contextWindow, { parent: contextWindow });
  }
  class BrowserElement {
    localName = 'button';
    isConnected = true;
    parentElement = null;
    firstChild = null;
    style = { cssText: '', setProperty() {} };
    getAttribute(name: string) {
      return name === 'id' ? 'confirm' : null;
    }
    getRootNode() {
      return document;
    }
    getBoundingClientRect() {
      return { x: 20, y: 30, width: 80, height: 40 };
    }
    matches() {
      return false;
    }
    setAttribute() {}
    attachShadow() {
      return { append() {} };
    }
    remove() {}
  }
  let focusedElement: BrowserElement | null = null;
  const document = {
    get activeElement() {
      return focusedElement;
    },
    documentElement: { append() {} },
    createElement: () => new BrowserElement(),
    querySelectorAll: () => [button],
  };
  const button = new BrowserElement();
  runInNewContext(getPreviewPickerScript(), {
    window: contextWindow,
    document,
    Element: BrowserElement,
    ShadowRoot: class {},
    CSS: { escape: (value: string) => value },
    URL,
  });

  function event(name: string, properties: Record<string, unknown>) {
    let prevented = false;
    for (const listener of listeners.get(name) ?? []) {
      listener({
        ...properties,
        preventDefault() {
          prevented = true;
        },
        stopImmediatePropagation() {},
      });
    }
    return prevented;
  }

  return {
    listeners,
    parent,
    sent,
    button,
    event,
    focusButton() {
      focusedElement = button;
    },
    message(data: unknown, source: unknown = parent, origin = 'https://pairdock.example') {
      for (const listener of listeners.get('message') ?? []) {
        listener({ data, source, origin });
      }
    },
    key(key: string) {
      return event('keydown', { key });
    },
  };
}

test('the picker script only connects to its actual parent and pins the parent origin', () => {
  const browser = createPickerBrowser();
  const connect = { channel: PREVIEW_SELECTION_CHANNEL, type: 'connect', nonce: 'current-preview' };

  browser.message(connect, {});
  browser.message(connect, browser.parent, 'null');
  browser.message({ ...connect, channel: 'unrelated' });
  browser.message({ ...connect, nonce: '' });
  assert.equal(browser.sent.length, 0);

  browser.message(connect);
  assert.deepEqual(browser.sent, [
    {
      message: { channel: PREVIEW_SELECTION_CHANNEL, type: 'ready', nonce: 'current-preview' },
      targetOrigin: 'https://pairdock.example',
    },
  ]);

  browser.message({ ...connect, nonce: 'stolen-preview' }, browser.parent, 'https://other.example');
  assert.equal(browser.sent.length, 1);
});

test('a touch selection suppresses its follow-up click and restores interaction on the next pointer gesture', () => {
  const browser = createPickerBrowser();
  const connect = { channel: PREVIEW_SELECTION_CHANNEL, type: 'connect', nonce: 'touch-preview' };
  browser.message(connect);
  browser.message({ ...connect, type: 'set-mode', enabled: true });
  const target = { composedPath: () => [browser.button] };

  assert.equal(browser.event('pointerup', { ...target, pointerType: 'touch' }), true);
  assert.equal(browser.sent.at(-1)?.message.type, 'selected');
  assert.equal(browser.event('touchend', target), true);
  assert.equal(browser.event('click', target), true);
  assert.equal(browser.event('pointerdown', target), false);
  assert.equal(browser.event('touchend', target), false);
  assert.equal(browser.event('click', target), false);

  browser.message({ ...connect, type: 'set-mode', enabled: true });
  browser.event('pointerup', { ...target, pointerType: 'touch' });
  assert.equal(browser.event('touchcancel', target), true);
  assert.equal(browser.event('pointerdown', target), false);
  assert.equal(browser.event('touchend', target), false);
  assert.equal(browser.event('click', target), false);
});

test('keyboard selection consumes the activation keyup after leaving picker mode', () => {
  const browser = createPickerBrowser();
  const connect = { channel: PREVIEW_SELECTION_CHANNEL, type: 'connect', nonce: 'keyboard-preview' };
  browser.message(connect);
  browser.message({ ...connect, type: 'set-mode', enabled: true });
  browser.focusButton();

  assert.equal(browser.key('Enter'), true);
  assert.equal(browser.sent.at(-1)?.message.type, 'selected');
  assert.equal(browser.key('Enter'), true);
  assert.equal(browser.event('keyup', { key: 'Enter' }), true);
  assert.equal(browser.event('keyup', { key: 'Enter' }), false);
});

test('the injected picker is inactive when the preview is opened outside an iframe', () => {
  const browser = createPickerBrowser(true);
  assert.equal(browser.listeners.size, 0);
  assert.equal(browser.sent.length, 0);
});

test('only current parent commands activate selection and Escape cancels selection with the current nonce', () => {
  const browser = createPickerBrowser();
  const connect = { channel: PREVIEW_SELECTION_CHANNEL, type: 'connect', nonce: 'current-preview' };
  const enable = { ...connect, type: 'set-mode', enabled: true };
  browser.message(connect);

  browser.message(enable, {});
  browser.message(enable, browser.parent, 'https://other.example');
  browser.message({ ...enable, nonce: 'expired-preview' });
  assert.equal(browser.key('Escape'), false);

  browser.message(enable);
  browser.message({ ...enable, nonce: 'expired-preview', enabled: false });
  assert.equal(browser.key('Escape'), true);
  assert.deepEqual(browser.sent.at(-1), {
    message: { channel: PREVIEW_SELECTION_CHANNEL, type: 'cancelled', nonce: 'current-preview' },
    targetOrigin: 'https://pairdock.example',
  });
  browser.event('keyup', { key: 'Escape' });
  assert.equal(browser.key('Escape'), false);

  browser.message(enable);
  browser.message({ ...connect, nonce: 'replacement-preview' });
  assert.equal(browser.key('Escape'), false);
});
