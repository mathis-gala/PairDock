import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginPage } from '../../../../apps/web/src/views/login-page.js';

test('BT-034: login screen renders distinct developer and PM entry points', () => {
  const html = renderToStaticMarkup(<LoginPage onAuthenticated={() => undefined} />);

  assert.match(html, /Espace développeur/);
  assert.match(html, /Espace produit/);
  assert.match(html, /Continuer avec GitHub/);
  assert.match(html, /Continuer avec Slack/);
});
