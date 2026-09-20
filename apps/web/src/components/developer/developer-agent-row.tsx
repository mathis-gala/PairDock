import type { DeveloperAgent } from '@pairdock/shared-contracts';
import { useState } from 'react';
import { Button } from '../button.js';
import { StatusBadge } from '../status-badge.js';

interface DeveloperAgentRowProps {
  agent: DeveloperAgent;
  errorMessage: string | null;
  isRevoking: boolean;
  onRevoke: (agentId: string) => void;
}

export function DeveloperAgentRow({ agent, errorMessage, isRevoking, onRevoke }: DeveloperAgentRowProps) {
  const [confirming, setConfirming] = useState(false);
  const isRevoked = Boolean(agent.revokedAt);
  let status = 'Hors ligne';
  let tone: 'neutral' | 'positive' | 'warning' = 'warning';
  if (isRevoked) {
    status = 'Révoqué';
    tone = 'neutral';
  } else if (agent.connected) {
    status = 'En ligne';
    tone = 'positive';
  }

  function handleStartRevoke() {
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
  }

  function handleConfirmRevoke() {
    onRevoke(agent.agentId);
  }

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="break-words text-base font-semibold">{agent.deviceName}</h3>
            <StatusBadge tone={tone}>{status}</StatusBadge>
          </div>
          <p className="text-xs leading-5 text-[#aeb5c3]">
            Associé le <time dateTime={agent.pairedAt}>{new Date(agent.pairedAt).toLocaleDateString()}</time>
            {' · '}Dernière activité :{' '}
            <time dateTime={agent.lastSeenAt}>{new Date(agent.lastSeenAt).toLocaleString()}</time>
          </p>
          {isRevoked ? (
            <p className="text-sm text-[#aeb5c3]">Cet appareil ne peut plus se connecter à ton compte.</p>
          ) : null}
          {!isRevoked && !agent.connected ? (
            <p className="text-sm text-[#aeb5c3]">Ouvre PairDock sur cet appareil pour le reconnecter.</p>
          ) : null}
        </div>
        {!isRevoked && !confirming ? (
          <Button onClick={handleStartRevoke} variant="secondary">
            Révoquer l’accès
          </Button>
        ) : null}
      </div>
      {confirming && !isRevoked ? (
        <div className="mt-4 rounded-[10px] border border-rose-400/30 bg-rose-400/5 p-4">
          <p className="text-sm font-semibold">Révoquer l’accès de {agent.deviceName} ?</p>
          <p className="mt-1 max-w-prose text-sm leading-6 text-[#cdd2dc]">
            Ses projets ne pourront plus lancer de sessions sur cet appareil. Pour le réutiliser, tu devras l’associer
            de nouveau.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button disabled={isRevoking} onClick={handleConfirmRevoke} variant="danger">
              {isRevoking ? 'Révocation…' : 'Confirmer la révocation'}
            </Button>
            <Button disabled={isRevoking} onClick={handleCancel} variant="ghost">
              Annuler
            </Button>
          </div>
          {errorMessage ? (
            <p className="mt-3 text-sm text-rose-300" role="alert">
              {errorMessage}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
