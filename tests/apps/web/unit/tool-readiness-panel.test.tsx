import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ToolReadinessPanel } from '../../../../apps/web/src/components/developer/tool-readiness-panel.js';

Object.assign(globalThis, { React });

test('readiness hides a previous successful result while the new check is pending', () => {
  const html = renderToStaticMarkup(
    <ToolReadinessPanel
      agentAvailability="online"
      isRequesting
      onRequestReadiness={async () => undefined}
      readiness={{ ok: true, checks: [{ key: 'git', required: true, status: 'passed', message: 'Previous success.' }] }}
    />,
  );
  assert.match(html, /Vérification en cours/);
  assert.match(html, /disabled/);
  assert.doesNotMatch(html, /Previous success|Prêt|Ready/);
});

test('offline readiness directs users to the desktop app and distinguishes the last known result', () => {
  const html = renderToStaticMarkup(
    <ToolReadinessPanel
      agentAvailability="offline"
      isRequesting={false}
      onRequestReadiness={async () => undefined}
      readiness={{ ok: true, checks: [] }}
    />,
  );
  assert.match(html, /application PairDock/);
  assert.match(html, /Dernier résultat/);
  assert.match(html, /disabled/);
  assert.doesNotMatch(html, /pairdock-agent/);
});
