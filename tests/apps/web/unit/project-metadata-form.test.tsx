import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildProjectMetadataUpdate,
  ProjectMetadataForm,
} from '../../../../apps/web/src/components/developer/project-metadata-form.js';

Object.assign(globalThis, { React });

test('project metadata form exposes named fields, current values, and an accessible request error', () => {
  const html = renderToStaticMarkup(
    createElement(ProjectMetadataForm, {
      description: 'Current description',
      error: 'Project update failed.',
      isSubmitting: false,
      name: 'Current project',
      onCancel: () => undefined,
      onSubmit: async () => undefined,
    }),
  );

  assert.match(html, /Modifier le projet/);
  assert.match(html, /Nom du projet/);
  assert.match(html, /Current project/);
  assert.match(html, /Description/);
  assert.match(html, /Current description/);
  assert.match(html, /role="alert"/);
  assert.match(html, /Project update failed\./);
  assert.match(html, /Annuler/);
  assert.match(html, /Enregistrer/);
});

test('editing only the description does not resend an unchanged legacy project name', () => {
  const legacyName = 'P'.repeat(121);

  assert.deepEqual(
    buildProjectMetadataUpdate(
      { name: legacyName, description: 'Old description' },
      { name: legacyName, description: 'New description' },
    ),
    { description: 'New description' },
  );
});
