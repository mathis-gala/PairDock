import assert from 'node:assert/strict';
import test from 'node:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoginPage } from '../../../../apps/web/src/views/login-page.js';

test('BT-034: login screen renders distinct developer and PM entry points', () => {
  const html = renderLoginPage();

  assert.match(html, /Espace développeur/);
  assert.match(html, /Espace produit/);
  assert.match(html, /Continuer avec GitHub App/);
  assert.match(html, /Continuer avec Slack App/);
  assert.match(html, /viewBox="0 0 24 24"/);
  assert.doesNotMatch(html, /Codex/);
});

test('development auth replaces OAuth redirects with explicit local role entry points', () => {
  const html = renderLoginPage({ developmentAuthEnabled: true });

  assert.match(html, /Entrer comme developer/);
  assert.match(html, /Entrer comme PM/);
  assert.match(html, /Mode local/);
  assert.doesNotMatch(html, /Continuer avec GitHub App/);
  assert.doesNotMatch(html, /Continuer avec Slack App/);
});

function renderLoginPage(providers?: { developmentAuthEnabled: boolean }): string {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  if (providers) {
    queryClient.setQueryData(['auth', 'providers'], providers);
  }

  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <LoginPage onAuthenticated={() => undefined} />
    </QueryClientProvider>,
  );
}
