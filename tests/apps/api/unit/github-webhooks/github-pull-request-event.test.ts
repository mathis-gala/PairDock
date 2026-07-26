import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGithubPullRequestEvent } from '../../../../../apps/api/src/github-webhooks/github-pull-request-event.js';

const cases = [
  { draft: true, merged: false, mergedAt: null, state: 'open', expected: 'draft' },
  { draft: false, merged: false, mergedAt: null, state: 'open', expected: 'open' },
  { draft: false, merged: false, mergedAt: null, state: 'closed', expected: 'closed' },
  {
    draft: false,
    merged: true,
    mergedAt: '2026-07-26T19:00:00.000Z',
    state: 'closed',
    expected: 'merged',
  },
] as const;

for (const testCase of cases) {
  test(`maps a GitHub pull request event to ${testCase.expected}`, () => {
    const update = parseGithubPullRequestEvent({
      installation: { id: 123456 },
      number: 57,
      repository: { full_name: 'mathis-gala/PairDock' },
      pull_request: {
        number: 57,
        html_url: 'https://github.com/mathis-gala/PairDock/pull/57',
        state: testCase.state,
        draft: testCase.draft,
        merged: testCase.merged,
        merged_at: testCase.mergedAt,
        updated_at: '2026-07-26T19:05:00.000Z',
      },
    });

    assert.equal(update.status, testCase.expected);
    assert.equal(update.providerConnectionId, '123456');
  });
}
