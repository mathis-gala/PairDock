import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeveloperProjectSetup, DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToStaticMarkup } from 'react-dom/server';
import { DeveloperOnboardingJourney } from '../../../../apps/web/src/components/developer/developer-onboarding-journey.js';
import type { AuthSession } from '../../../../apps/web/src/schemas/auth.js';
import { DeveloperHomePage } from '../../../../apps/web/src/views/developer-home-page.js';

const session: AuthSession = {
  accessToken: 'onboarding-owner',
  provider: 'github',
  user: { id: 'owner', email: 'owner@example.com', displayName: 'Camille', kind: 'developer' },
};
const project: DeveloperProjectSummary = {
  id: 'project-existing',
  name: 'Boutique',
  description: null,
  repoFullName: 'team/shop',
  defaultBranch: 'main',
  defaultModelId: 'test-model',
  defaultReasoningEffort: 'medium',
  agentProjectKey: 'existing-folder',
  sourceControlAccountLogin: 'team',
  pmCanStartSessions: true,
  pmMemberCount: 0,
  pmMembers: [],
  agentAvailability: 'online',
  readiness: null,
  sessions: [],
};
const setup: DeveloperProjectSetup = {
  repositories: [{ fullName: 'team/new-project', name: 'Nouveau dépôt', defaultBranch: 'main', branches: ['main'] }],
  agents: [
    {
      agentId: 'agent-camille',
      capabilities: [],
      models: [{ id: 'test-model', label: 'Modèle disponible', provider: 'local' }],
      projects: [
        {
          key: 'new-folder',
          name: 'Nouveau dépôt',
          repoFullName: 'team/new-project',
          pathAlias: 'new-project',
          readiness: null,
        },
      ],
    },
  ],
};

function renderHome(
  projects: DeveloperProjectSummary[],
  availableSetup: DeveloperProjectSetup,
  agentProjectKey?: string,
) {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['developer-projects', session.accessToken], projects);
  queryClient.setQueryData(['developer-project-setup', session.accessToken], availableSetup);
  queryClient.setQueryData(['developer-agents', session.accessToken], []);
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <DeveloperHomePage agentProjectKey={agentProjectKey} onSignOut={() => undefined} session={session} />
    </QueryClientProvider>,
  );
}

test('existing projects keep creation closed until requested, including a handoff to an existing project', () => {
  for (const handoff of [undefined, project.agentProjectKey]) {
    const html = renderHome([project], setup, handoff);
    assert.match(html, /Nouveau projet/);
    assert.doesNotMatch(html, /developer-project-name|Configurer une instance/);
    assert.match(html, /developer-project-project-existing-readiness/);
    assert.match(html, /developer-project-project-existing-invite/);
  }
});

test('a new desktop handoff opens only its project creation while the first-run path explains missing prerequisites', () => {
  const handoffHtml = renderHome([project], setup, 'new-folder');
  assert.match(handoffHtml, /value="Nouveau dépôt"/);
  assert.match(handoffHtml, /value="new-folder" selected=""/);
  assert.doesNotMatch(handoffHtml, /Prochaine étape pour Boutique/);

  const emptyHtml = renderHome([], { repositories: setup.repositories, agents: [] });
  assert.match(emptyHtml, /Aucun agent local en ligne/);
  assert.match(emptyHtml, /href="#\/developer\/agents"/);
  assert.doesNotMatch(emptyHtml, /developer-project-name|PairDock local project/);
});

test('the journey does not combine verification and membership from different projects', () => {
  const sharedProject = {
    ...project,
    id: 'other-project',
    name: 'Autre projet',
    readiness: { ok: true, checks: [] },
    pmMemberCount: 1,
  };
  const html = renderHome([project, sharedProject], setup);
  const currentStep = html.match(/<li aria-current="step">(.*?)<\/li>/s)?.[1] ?? '';
  assert.match(currentStep, /Vérifier/);
  assert.doesNotMatch(currentStep, /Inviter/);
  assert.match(html, /Prochaine étape pour Boutique/);
});

test('a running verification does not present its previous successful result as complete', () => {
  const html = renderToStaticMarkup(
    <DeveloperOnboardingJourney
      isVerifying
      onCreateProject={() => undefined}
      project={{ ...project, readiness: { ok: true, checks: [] }, pmMemberCount: 1 }}
      setup={setup}
    />,
  );
  const currentStep = html.match(/<li aria-current="step">(.*?)<\/li>/s)?.[1] ?? '';
  assert.match(currentStep, /Vérifier/);
  assert.match(currentStep, /Vérification en cours/);
  assert.doesNotMatch(html, /Vérifications réussies|Configuration terminée/);
});
