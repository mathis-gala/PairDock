import { SectionCard } from '../ui/section-card.js';
import type { SessionMessageView } from './session-schemas.js';

interface PromptHistoryPanelProps {
  messages: SessionMessageView[];
}

export function PromptHistoryPanel({ messages }: PromptHistoryPanelProps) {
  return (
    <SectionCard
      title="Prompt history"
      description="Stored PM and developer messages remain visible on reload through the new session message endpoint."
    >
      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-sm text-slate-500">
          No prompts have been stored for this session yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                <span>{message.role}</span>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-200">{message.content}</p>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
