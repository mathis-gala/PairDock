import { SectionCard } from '../ui/section-card.js';
import type { SessionView } from './session-schemas.js';

interface DiffPanelProps {
  latestDiff: SessionView['latestDiff'];
}

export function DiffPanel({ latestDiff }: DiffPanelProps) {
  return (
    <SectionCard
      title="Latest diff"
      description="The PM route always shows the most recent persisted git diff snapshot for the session."
    >
      {latestDiff ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Changed files: {latestDiff.changedFiles.join(', ') || 'none'}</p>
          <pre className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
            {latestDiff.diff}
          </pre>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-sm text-slate-500">
          No diff snapshot has been published for this session yet.
        </p>
      )}
    </SectionCard>
  );
}
