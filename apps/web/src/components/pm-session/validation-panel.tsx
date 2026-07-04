import type { ValidationSummaryView } from '../../schemas/session.js';
import { SectionCard } from '../section-card.js';

interface ValidationPanelProps {
  validation: ValidationSummaryView | null;
}

export function ValidationPanel({ validation }: ValidationPanelProps) {
  return (
    <SectionCard
      title="Latest validation"
      description="Build, lint, test, and preview status are pulled from the persisted validation result summary."
    >
      {validation ? (
        <dl className="grid gap-3 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="text-slate-500">Overall</dt>
            <dd>{validation.status}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Build</dt>
            <dd>{validation.buildStatus ?? 'pending'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Lint</dt>
            <dd>{validation.lintStatus ?? 'pending'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Test</dt>
            <dd>{validation.testStatus ?? 'pending'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Preview</dt>
            <dd>{validation.previewStatus ?? 'pending'}</dd>
          </div>
          {validation.summary ? (
            <div className="md:col-span-2 xl:col-span-3">
              <dt className="text-slate-500">Summary</dt>
              <dd>{validation.summary}</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-sm text-slate-500">
          No validation summary has been recorded for this session yet.
        </p>
      )}
    </SectionCard>
  );
}
