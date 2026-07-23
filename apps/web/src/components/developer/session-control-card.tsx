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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-[#20242b]">Session {session.id.slice(0, 8)}</p>
          <p className="text-xs text-slate-600">Model {session.modelId}</p>
        </div>
        <StatusBadge tone={session.status === 'CLOSED' ? 'neutral' : 'positive'}>{session.status}</StatusBadge>
      </div>
      <p className="mt-2 text-xs text-slate-600">Started {new Date(session.createdAt).toLocaleString()}</p>
      {session.closedAt ? (
        <p className="text-xs text-slate-600">Cleanup closed {new Date(session.closedAt).toLocaleString()}</p>
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
      {canClose ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {confirmingClose ? (
            <>
              <span className="text-xs text-amber-300">Confirm cleanup close?</span>
              <Button
                disabled={closePending}
                onClick={async () => {
                  await onClose(session.id);
                  setConfirmingClose(false);
                }}
                variant="danger"
              >
                {closePending ? 'Closing…' : 'Confirm close'}
              </Button>
              <Button disabled={closePending} onClick={() => setConfirmingClose(false)} variant="ghost">
                Cancel
              </Button>
            </>
          ) : (
            <Button disabled={closePending} onClick={() => setConfirmingClose(true)} variant="danger">
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
