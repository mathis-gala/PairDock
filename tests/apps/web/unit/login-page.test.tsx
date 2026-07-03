import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginPage } from '../../../../apps/web/src/auth/login-page.js';

test('BT-034: login screen renders distinct developer and PM entry points', () => {
  const html = renderToStaticMarkup(<LoginPage onAuthenticated={() => undefined} />);

  assert.match(html, /GitHub-backed developer sign-in/);
  assert.match(html, /Slack-backed PM sign-in/);
  assert.match(html, /Sign in as developer/);
  assert.match(html, /Sign in as PM/);
});
