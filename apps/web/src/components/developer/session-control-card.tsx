import type { DeveloperProjectSessionSummary } from '@pairdock/shared-contracts';
import { useState } from 'react';
import { Button } from '../button.js';
import { StatusBadge } from '../status-badge.js';

interface SessionControlCardProps {
  closePending: boolean;
  onClose: (sessionId: string) => Promise<void>;
  session: DeveloperProjectSessionSummary;
}

export function SessionControlCard({ closePending, onClose, session }: SessionControlCardProps) {
  const [confirmingClose, setConfirmingClose] = useState(false);
  const canClose = session.status !== 'CLOSED';

  function handleStartClose() {
    setConfirmingClose(true);
  }

  function handleCancelClose() {
    setConfirmingClose(false);
  }

  async function handleConfirmClose() {
    await onClose(session.id);
    setConfirmingClose(false);
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-white">Session {session.id.slice(0, 8)}</p>
          <p className="text-xs text-slate-500">Model {session.modelId}</p>
        </div>
        <StatusBadge tone={session.status === 'CLOSED' ? 'neutral' : 'positive'}>{session.status}</StatusBadge>
      </div>
      <p className="mt-2 text-xs text-slate-500">Started {new Date(session.createdAt).toLocaleString()}</p>
      {session.closedAt ? (
        <p className="text-xs text-slate-500">Cleanup closed {new Date(session.closedAt).toLocaleString()}</p>
      ) : null}
      {session.reviewRequestUrl ? (
        <a
          className="mt-2 inline-block text-xs font-semibold text-sky-300 underline"
          href={session.reviewRequestUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open draft review request
        </a>
      ) : null}
      <a
        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-[#23272f] px-3 py-2 text-xs font-semibold text-[#eef0f4] transition hover:border-white/20 hover:bg-[#2a2f38] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/40"
        href={`#/developer/sessions/${session.id}`}
      >
        <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
          <path
            d="M3.5 12s3.2-5 8.5-5 8.5 5 8.5 5-3.2 5-8.5 5-8.5-5-8.5-5Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth="1.7" />
        </svg>
        Inspecter la session
      </a>
      {canClose ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirmingClose ? (
            <>
              <span className="text-xs text-amber-300">Confirm cleanup close?</span>
              <Button disabled={closePending} onClick={handleConfirmClose} variant="danger">
                {closePending ? 'Closing…' : 'Confirm close'}
              </Button>
              <Button disabled={closePending} onClick={handleCancelClose} variant="ghost">
                Cancel
              </Button>
            </>
          ) : (
            <Button disabled={closePending} onClick={handleStartClose} variant="danger">
              Close session
            </Button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-emerald-300">Cleanup status visible: local close completed.</p>
      )}
    </div>
  );
}
