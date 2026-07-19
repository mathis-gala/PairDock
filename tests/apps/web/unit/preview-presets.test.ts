import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getFittedPreviewScale,
  getPreviewFrameStyle,
  previewPresets,
} from '../../../../apps/web/src/lib/preview-presets.js';

test('BT-027: mobile preset applies the 375px preview width', () => {
  const style = getPreviewFrameStyle('mobile');

  assert.equal(style.width, '375px');
  assert.equal(style.height, '812px');
  assert.equal(previewPresets.at(-1)?.id, 'mobile');
});

test('PM preview scales down to fit both available width and height', () => {
  assert.equal(getFittedPreviewScale(960, 700, 1280, 900), 0.75);
  assert.equal(getFittedPreviewScale(500, 900, 1280, 900), 0.390625);
  assert.equal(getFittedPreviewScale(1600, 1200, 1280, 900), 1);
});
