import assert from 'node:assert/strict';
import test from 'node:test';
import { getPreviewFrameStyle, previewPresets } from '../../../../apps/web/src/pm-session/preview-presets.js';

test('BT-027: mobile preset applies the 375px preview width', () => {
  const style = getPreviewFrameStyle('mobile');

  assert.equal(style.width, '375px');
  assert.equal(style.height, '812px');
  assert.equal(previewPresets.at(-1)?.id, 'mobile');
});
