import { createHash } from 'node:crypto';
import type { SessionStatus } from '@pairdock/domain';

interface SeedEnvironment {
  DATABASE_URL?: string;
  NODE_ENV?: string;
}

interface PmDemoMessage {
  content: string;
  createdAt: Date;
  id: string;
  role: 'assistant' | 'user';
}

interface PmDemoValidation {
  buildStatus: 'failed' | 'passed';
  id: string;
  lintStatus: 'failed' | 'passed';
  previewStatus: 'failed' | 'passed';
  status: 'failed' | 'passed';
  testStatus: 'failed' | 'passed';
}

export interface PmDemoSession {
  branchName: string;
  closedAt: Date | null;
  createdAt: Date;
  diff: { changedFiles: string[]; diff: string; id: string } | null;
  id: string;
  lastError: string | null;
  messages: PmDemoMessage[];
  reviewRequest: { id: string; number: number; status: 'draft'; url: null } | null;
  status: SessionStatus;
  validation: PmDemoValidation | null;
}

export function assertLocalDevelopmentSeedTarget(environment: SeedEnvironment): URL {
  if (environment.NODE_ENV === 'production') {
    throw new Error('PM demo seed refuses NODE_ENV=production.');
  }

  if (!environment.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for PM demo seed.');
  }

  let target: URL;

  try {
    target = new URL(environment.DATABASE_URL);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL URL.');
  }

  const localHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);
  if (!['postgres:', 'postgresql:'].includes(target.protocol) || !localHosts.has(target.hostname)) {
    throw new Error('PM demo seed requires a local PostgreSQL database.');
  }

  if (!target.pathname.replace(/^\/+/, '')) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  return target;
}

export function buildPmDemoSessions(projectId: string, now: Date): PmDemoSession[] {
  const definitions: Array<{
    ageInDays: number;
    assistantMessage: string;
    lastError?: string;
    pmMessage: string;
    status: SessionStatus;
    validation?: Omit<PmDemoValidation, 'id'>;
    withDiff?: boolean;
    withReviewRequest?: boolean;
  }> = [
    {
      ageInDays: 0,
      status: 'READY',
      pmMessage: 'Démo UI : je veux rendre le bouton principal plus clair.',
      assistantMessage: 'Session préparée. Cette conversation seedée sert uniquement à tester l’interface PM.',
    },
    {
      ageInDays: 1,
      status: 'AGENT_RUNNING',
      pmMessage: 'Démo UI : ajoute un état de chargement sur la liste.',
      assistantMessage: 'Je localise le composant puis je prépare une modification ciblée.',
    },
    {
      ageInDays: 2,
      status: 'AWAITING_PM_VALIDATION',
      pmMessage: 'Démo UI : améliore le contraste de la navigation.',
      assistantMessage: 'Modification terminée. Build, tests, lint et preview passent. Tu peux ouvrir la modale PR.',
      validation: passingValidation(),
      withDiff: true,
    },
    {
      ageInDays: 3,
      status: 'FAILED',
      pmMessage: 'Démo UI : renomme le titre de la page.',
      assistantMessage: 'Modification appliquée, mais le lint a détecté une erreur de formatage.',
      lastError: 'Lint failed: formatting differs in src/components/PageHeader.tsx.',
      validation: {
        status: 'failed',
        buildStatus: 'passed',
        testStatus: 'passed',
        lintStatus: 'failed',
        previewStatus: 'passed',
      },
      withDiff: true,
    },
    {
      ageInDays: 5,
      status: 'REVIEW_REQUEST_CREATED',
      pmMessage: 'Démo UI : ajoute une aide sous le formulaire.',
      assistantMessage: 'Travail validé. Une draft pull request de démonstration a été créée.',
      validation: passingValidation(),
      withDiff: true,
      withReviewRequest: true,
    },
    {
      ageInDays: 8,
      status: 'CLOSED',
      pmMessage: 'Démo UI : corrige l’alignement mobile des cartes.',
      assistantMessage: 'Demande terminée et session nettoyée.',
      validation: passingValidation(),
      withDiff: true,
      withReviewRequest: true,
    },
  ];

  return definitions.map((definition, index) => {
    const id = deterministicUuid(`${projectId}:pm-demo-session:${index}`);
    const createdAt = new Date(now.getTime() - definition.ageInDays * 24 * 60 * 60 * 1_000);
    const messageBaseTime = createdAt.getTime() + 60_000;

    return {
      id,
      status: definition.status,
      branchName: `pairdock/demo-${definition.status.toLowerCase().replaceAll('_', '-')}`,
      createdAt,
      closedAt: definition.status === 'CLOSED' ? new Date(createdAt.getTime() + 45 * 60 * 1_000) : null,
      lastError: definition.lastError ?? null,
      messages: [
        {
          id: deterministicUuid(`${id}:message:pm`),
          role: 'user',
          content: definition.pmMessage,
          createdAt: new Date(messageBaseTime),
        },
        {
          id: deterministicUuid(`${id}:message:assistant`),
          role: 'assistant',
          content: definition.assistantMessage,
          createdAt: new Date(messageBaseTime + 60_000),
        },
      ],
      diff: definition.withDiff ? demoDiff(deterministicUuid(`${id}:diff`)) : null,
      validation: definition.validation
        ? { ...definition.validation, id: deterministicUuid(`${id}:validation`) }
        : null,
      reviewRequest: definition.withReviewRequest
        ? { id: deterministicUuid(`${id}:review-request`), number: 100 + index, status: 'draft', url: null }
        : null,
    };
  });
}

function deterministicUuid(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex').slice(0, 32).split('');
  hash[12] = '5';
  hash[16] = '8';
  const value = hash.join('');
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20)}`;
}

function passingValidation(): Omit<PmDemoValidation, 'id'> {
  return {
    status: 'passed',
    buildStatus: 'passed',
    testStatus: 'passed',
    lintStatus: 'passed',
    previewStatus: 'passed',
  };
}

function demoDiff(id: string): NonNullable<PmDemoSession['diff']> {
  return {
    id,
    changedFiles: ['src/components/DemoCard.tsx', 'src/styles/demo.css'],
    diff: [
      'diff --git a/src/components/DemoCard.tsx b/src/components/DemoCard.tsx',
      '--- a/src/components/DemoCard.tsx',
      '+++ b/src/components/DemoCard.tsx',
      '@@ -1,3 +1,3 @@',
      '-<button className="secondary">Continuer</button>',
      '+<button className="primary">Continuer</button>',
    ].join('\n'),
  };
}
