import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ImageLightbox } from '../../../../apps/web/src/components/image-lightbox.js';

test('image lightbox exposes one keyboard focus target and keeps its backdrop out of tab order', () => {
  const html = renderToStaticMarkup(
    createElement(ImageLightbox, {
      alt: 'Capture du formulaire',
      onClose: () => undefined,
      src: 'data:image/png;base64,AAAA',
    }),
  );

  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-label="Fermer l’aperçu"[^>]*tabindex="-1"/);
  assert.match(html, /data-image-lightbox-close="true"/);
});
