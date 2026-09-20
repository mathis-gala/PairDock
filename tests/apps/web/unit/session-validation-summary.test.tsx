import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SessionValidationSummary } from '../../../../apps/web/src/components/pm-session/session-validation-summary.js';
import { getReviewRequestBlockedReason } from '../../../../apps/web/src/lib/session-validation.js';
import type { SessionView } from '../../../../apps/web/src/schemas/session.js';

test('validation shows skipped and missing checks without presenting the aggregate as full success', () => {
  const html = renderToStaticMarkup(
    createElement(SessionValidationSummary, {
      changedFiles: ['src/cart.ts', 'src/cart.test.ts'],
      sessionStatus: 'AWAITING_PM_VALIDATION',
      validation: {
        status: 'passed',
        buildStatus: 'passed',
        testStatus: 'skipped',
        lintStatus: null,
        previewStatus: 'failed',
      },
    }),
  );

  assert.match(html, /2 fichiers modifiés/);
  assert.match(html, /src\/cart.test.ts/);
  assert.match(html, /Réussi/);
  assert.match(html, /Non exécuté/);
  assert.match(html, /Non renseigné/);
  assert.match(html, /Échoué/);
  assert.match(html, /Des contrôles ont échoué/);
  assert.doesNotMatch(html, /Tous les contrôles ont réussi/);
});

test('previous successful checks are identified as previous results during a new run, and missing validation stays unknown', () => {
  const running = renderToStaticMarkup(
    createElement(SessionValidationSummary, {
      changedFiles: ['src/cart.ts'],
      sessionStatus: 'CHECKS_RUNNING',
      validation: {
        status: 'passed',
        buildStatus: 'passed',
        testStatus: 'passed',
        lintStatus: 'passed',
        previewStatus: 'passed',
      },
    }),
  );
  assert.match(running, /ne valident pas encore les nouvelles modifications/);
  const empty = renderToStaticMarkup(
    createElement(SessionValidationSummary, {
      changedFiles: null,
      sessionStatus: 'READY',
      validation: null,
    }),
  );
  assert.match(empty, /Aucun résultat de validation reçu/);
  assert.match(empty, /Liste des fichiers non reçue/);
  assert.doesNotMatch(empty, /Réussi|0 fichiers modifiés/);
});

test('PR eligibility keeps authorization, lifecycle, connectivity and actual check requirements', () => {
  const session: SessionView = {
    id: 'session',
    projectId: 'project',
    createdByUserId: 'pm',
    status: 'AWAITING_PM_VALIDATION',
    modelId: 'model',
    reasoningEffort: 'medium',
    branchName: 'feature',
    worktreeRef: null,
    previewUrl: 'https://preview.test',
    lastError: null,
    participants: [],
    latestDiff: null,
    latestValidation: {
      status: 'passed',
      buildStatus: 'passed',
      testStatus: 'passed',
      lintStatus: 'passed',
      previewStatus: 'passed',
    },
    project: {
      id: 'project',
      name: 'Projet',
      defaultBranch: 'main',
      ownerDisplayName: 'Dev',
      owningAgentId: 'agent',
      agentAvailability: 'online',
    },
    createdAt: '2026-09-20',
    closedAt: null,
  };
  assert.equal(getReviewRequestBlockedReason(session, false), null);
  assert.match(getReviewRequestBlockedReason(session, true) ?? '', /participants autorisés/);
  assert.ok(getReviewRequestBlockedReason({ ...session, status: 'AGENT_RUNNING' }, false));
  assert.ok(getReviewRequestBlockedReason({ ...session, status: 'CLOSED' }, false));
  assert.match(
    getReviewRequestBlockedReason(
      { ...session, project: { ...session.project, agentAvailability: 'offline' } },
      false,
    ) ?? '',
    /hors ligne/,
  );
  assert.ok(
    getReviewRequestBlockedReason(
      { ...session, reviewRequest: { url: 'https://github.test/pr/1', number: 1, status: 'open' } },
      false,
    ),
  );
  for (const testStatus of ['skipped', 'failed', null, 'unrecognized']) {
    assert.ok(
      getReviewRequestBlockedReason(
        { ...session, latestValidation: { ...session.latestValidation, status: 'passed', testStatus } },
        false,
      ),
    );
  }
});
