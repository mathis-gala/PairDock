import assert from 'node:assert/strict';
import test from 'node:test';
import type { PairDockIdentity } from '@pairdock/domain';
import { ProjectsService } from '../../../../../apps/api/src/projects/projects.service.js';

test('developer setup lists repositories from every GitHub App installation accessible to the user', async () => {
  const user: PairDockIdentity = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'developer@pairdock.test',
    displayName: 'Developer',
    kind: 'developer',
  };
  const externalIdentitiesRepository = {
    findByUserAndProvider: async () => ({
      metadata: {
        installations: [
          { accountLogin: 'developer', installationId: 'personal-installation' },
          { accountLogin: 'pairdock-org', installationId: 'organization-installation' },
        ],
      },
    }),
  };
  const sourceControl = {
    listInstallationRepositories: async ({ providerConnectionId }: { providerConnectionId: string }) =>
      providerConnectionId === 'personal-installation'
        ? [{ defaultBranch: 'main', fullName: 'developer/personal-repo', name: 'personal-repo' }]
        : [{ defaultBranch: 'main', fullName: 'pairdock-org/org-repo', name: 'org-repo' }],
    listRepositoryBranches: async () => ['main'],
  };
  const service = new ProjectsService(
    {} as never,
    externalIdentitiesRepository as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {
      listSnapshots: () => [
        {
          agentId: 'agent-id',
          capabilities: [],
          models: [],
          projects: [
            {
              key: 'accessible-project',
              name: 'Accessible project',
              repoFullName: 'pairdock-org/org-repo',
              pathAlias: 'org-repo',
            },
            {
              key: 'private-project',
              name: 'Private project',
              repoFullName: 'another-org/private-repo',
              pathAlias: 'private-repo',
            },
          ],
        },
      ],
    } as never,
    {
      listModelsForProject: () => [],
      resolveSessionSelection: (_key: string, selection: unknown) => selection,
    } as never,
    {} as never,
    sourceControl as never,
  );

  const setup = await service.getDeveloperProjectSetup(user);

  assert.deepEqual(
    setup.repositories.map((repository) => repository.fullName),
    ['developer/personal-repo', 'pairdock-org/org-repo'],
  );
  assert.deepEqual(
    setup.agents.flatMap((agent) => agent.projects.map((project) => project.key)),
    ['accessible-project'],
  );
});

test('project creation derives the organization installation from the selected repository', async () => {
  const user: PairDockIdentity = {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'developer@pairdock.test',
    displayName: 'Developer',
    kind: 'developer',
  };
  const externalIdentitiesRepository = {
    findByUserAndProvider: async () => ({
      metadata: {
        installations: [
          { accountLogin: 'developer', installationId: 'personal-installation' },
          { accountLogin: 'pairdock-org', installationId: 'organization-installation' },
        ],
      },
    }),
  };
  let createdProviderConnectionId: string | null = null;
  const sourceControlConnectionsRepository = {
    findByOwnerAndProviderConnection: async () => null,
    create: async (input: { accountLogin: string; providerConnectionId: string }) => {
      createdProviderConnectionId = input.providerConnectionId;
      return {
        id: 'connection-id',
        ownerUserId: user.id,
        provider: 'github' as const,
        providerConnectionId: input.providerConnectionId,
        accountLogin: input.accountLogin,
        createdAt: new Date(0),
      };
    },
  };
  const sourceControl = {
    listInstallationRepositories: async ({ providerConnectionId }: { providerConnectionId: string }) =>
      providerConnectionId === 'organization-installation'
        ? [{ defaultBranch: 'main', fullName: 'pairdock-org/org-repo', name: 'org-repo' }]
        : [{ defaultBranch: 'main', fullName: 'developer/personal-repo', name: 'personal-repo' }],
    listRepositoryBranches: async () => ['main'],
  };
  const projectsRepository = {
    create: async (input: Record<string, unknown>) => ({
      ...input,
      id: 'project-id',
      description: null,
      defaultModelId: 'gpt-5.5',
      pmCanStartSessions: true,
      createdAt: new Date(0),
    }),
  };
  const connectedAgentsRegistry = {
    findSocketId: () => 'socket-id',
    listSnapshots: () => [
      {
        agentId: 'agent-id',
        capabilities: [],
        models: [{ id: 'gpt-5.5', label: 'GPT-5.5', provider: 'codex' }],
        projects: [
          {
            key: 'org-project',
            name: 'Org project',
            repoFullName: 'pairdock-org/org-repo',
            pathAlias: 'org-repo',
            models: ['gpt-5.5'],
          },
        ],
      },
    ],
  };
  const service = new ProjectsService(
    projectsRepository as never,
    externalIdentitiesRepository as never,
    {} as never,
    {} as never,
    sourceControlConnectionsRepository as never,
    {} as never,
    {} as never,
    {} as never,
    connectedAgentsRegistry as never,
    {
      listModelsForProject: () => [],
      resolveSessionSelection: (_key: string, selection: unknown) => selection,
    } as never,
    { isConnected: () => true } as never,
    sourceControl as never,
  );

  await service.createDeveloperProject(
    {
      name: 'Organization project',
      repoFullName: 'pairdock-org/org-repo',
      defaultBranch: 'main',
      defaultModelId: 'gpt-5.5',
      defaultReasoningEffort: 'medium',
      agentProjectKey: 'org-project',
    },
    user,
  );

  assert.equal(createdProviderConnectionId, 'organization-installation');
});
