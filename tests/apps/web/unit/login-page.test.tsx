import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginPage } from '../../../../apps/web/src/views/login-page.js';

function renderLoginPage(developmentPmAuthEnabled: boolean): string {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['auth', 'providers'], { developmentPmAuthEnabled });

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <LoginPage onAuthenticated={() => undefined} />
    </QueryClientProvider>,
  );
}

test('BT-034: production login renders GitHub for developers and Slack for PMs', () => {
  const html = renderLoginPage(false);

  assert.match(html, /Espace développeur/);
  assert.match(html, /Espace produit/);
  assert.match(html, /Continuer avec GitHub App/);
  assert.match(html, /Continuer avec Slack App/);
  assert.doesNotMatch(html, /Entrer comme PM local/);
  assert.match(html, /viewBox="0 0 24 24"/);
  assert.doesNotMatch(html, /Codex/);
});

test('local login keeps GitHub mandatory for developers and skips Slack only for PMs', () => {
  const html = renderLoginPage(true);

  assert.match(html, /Continuer avec GitHub App/);
  assert.match(html, /Entrer comme PM local/);
  assert.match(html, /pm@pairdock\.test/);
  assert.doesNotMatch(html, /Continuer avec Slack App/);
  assert.doesNotMatch(html, /Entrer comme développeur local/);
});
