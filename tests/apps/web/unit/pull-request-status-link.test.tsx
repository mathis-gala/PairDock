import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PullRequestStatusLink } from '../../../../apps/web/src/components/pull-request-status-link.js';

test('pull request links use GitHub open, closed, and merged states with text labels', () => {
  const cases = [
    { expectedLabel: 'Draft', expectedState: 'open', number: 100, status: 'draft' },
    { expectedLabel: 'Open', expectedState: 'open', number: 101, status: 'open' },
    { expectedLabel: 'Closed', expectedState: 'closed', number: 102, status: 'closed' },
    { expectedLabel: 'Merged', expectedState: 'merged', number: 103, status: 'merged' },
  ] as const;

  for (const fixture of cases) {
    const html = renderToStaticMarkup(
      createElement(PullRequestStatusLink, {
        reviewRequest: {
          number: fixture.number,
          status: fixture.status,
          url: `https://github.com/mathis-gala/PairDock/pull/${fixture.number}`,
        },
      }),
    );

    assert.match(html, new RegExp(`data-pr-state="${fixture.expectedState}"`));
    assert.match(html, new RegExp(`PR #${fixture.number}`));
    assert.match(html, new RegExp(`>${fixture.expectedLabel}<`));
    assert.match(html, /<svg/);
  }
});
