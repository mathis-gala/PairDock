import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendScreenshotFiles,
  getPastedImageFiles,
  type SelectedScreenshot,
} from '../../../../apps/web/src/components/screenshot-picker.js';

test('pasted clipboard images are added through the shared screenshot selection flow', () => {
  const screenshot = new File(['image'], 'capture.png', { type: 'image/png' });
  const text = new File(['notes'], 'notes.txt', { type: 'text/plain' });
  const clipboardData = {
    items: [
      {
        getAsFile: () => screenshot,
        kind: 'file',
        type: screenshot.type,
      },
      {
        getAsFile: () => text,
        kind: 'file',
        type: text.type,
      },
      {
        getAsFile: () => null,
        kind: 'string',
        type: 'text/plain',
      },
    ],
  };
  let error: string | null = 'previous error';
  let selected: SelectedScreenshot[] = [];

  const pastedImages = getPastedImageFiles(clipboardData);
  const didAddImages = appendScreenshotFiles({
    files: pastedImages,
    onChange: (screenshots) => {
      selected = screenshots;
    },
    onError: (message) => {
      error = message;
    },
    screenshots: [],
  });

  assert.equal(didAddImages, true);
  assert.deepEqual(pastedImages, [screenshot]);
  assert.equal(selected.length, 1);
  assert.equal(selected[0]?.file, screenshot);
  assert.match(selected[0]?.previewUrl ?? '', /^blob:/);
  assert.equal(error, null);

  URL.revokeObjectURL(selected[0]?.previewUrl ?? '');
});

test('pasted clipboard images respect the four screenshot limit', () => {
  const screenshot = new File(['image'], 'capture.png', { type: 'image/png' });
  const selectedScreenshots = Array.from({ length: 4 }, (_, index) => ({
    file: screenshot,
    id: String(index),
    previewUrl: `blob:${index}`,
  }));
  let error: string | null = null;
  let didChange = false;

  const didAddImages = appendScreenshotFiles({
    files: [screenshot],
    onChange: () => {
      didChange = true;
    },
    onError: (message) => {
      error = message;
    },
    screenshots: selectedScreenshots,
  });

  assert.equal(didAddImages, false);
  assert.equal(didChange, false);
  assert.equal(error, 'Tu peux joindre jusqu’à 4 captures.');
});
