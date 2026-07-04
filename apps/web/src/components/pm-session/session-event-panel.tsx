import { formatEventPayload } from '../../lib/format-event-payload.js';
import type { SessionEventRecordView } from '../../schemas/session.js';
import type { SessionEventFeedSnapshot } from '../../schemas/session-feed.js';
import { SectionCard } from '../section-card.js';

interface SessionEventPanelProps {
  events: SessionEventRecordView[];
  feed: SessionEventFeedSnapshot;
}

export function SessionEventPanel({ events, feed }: SessionEventPanelProps) {
  return (
    <SectionCard
      title="Event stream"
      description={
        feed.errorMessage ??
        'Live gateway events stream into this timeline while the persisted event endpoint preserves history across reloads.'
      }
    >
      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-sm text-slate-500">
          No agent events have been recorded for this session yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {events.map((eventRecord) => (
            <li key={eventRecord.id} className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                <span>{eventRecord.type}</span>
                <span>{new Date(eventRecord.createdAt).toLocaleString()}</span>
              </div>
              <pre className="overflow-auto whitespace-pre-wrap text-xs text-slate-200">
                {formatEventPayload(eventRecord.payload)}
              </pre>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
