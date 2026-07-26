import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DropdownMenuField } from '../../../../apps/web/src/components/dropdown-menu-field.js';

test('dropdown menu field exposes the selected filter through an accessible menu trigger', () => {
  const html = renderToStaticMarkup(
    createElement(DropdownMenuField, {
      id: 'session-status-filter',
      label: 'Statut',
      onValueChange: () => undefined,
      options: [
        { label: 'Toutes les sessions', value: 'all' },
        { label: 'Ouvertes', value: 'opened' },
        { label: 'Fermées', value: 'closed' },
      ],
      value: 'opened',
    }),
  );

  assert.match(html, /aria-haspopup="menu"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, />Statut</);
  assert.match(html, />Ouvertes</);
  assert.doesNotMatch(html, /<select/);
});
