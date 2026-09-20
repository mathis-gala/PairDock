import { agentPairingUserCodeSchema } from '@pairdock/shared-contracts';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { openDeveloperAgents } from '../../hooks/use-app-route.js';
import { useAgentPairing } from '../../hooks/use-developer-agents.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { TextInput } from '../text-input.js';

interface AgentPairingPanelProps {
  accessToken: string;
  userCode: string | null;
}

export function AgentPairingPanel({ accessToken, userCode }: AgentPairingPanelProps) {
  const { pairingQuery, approveMutation } = useAgentPairing(accessToken, userCode);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const pairing = pairingQuery.data;

  function handleCodeChange(event: ChangeEvent<HTMLInputElement>) {
    setEnteredCode(event.target.value);
    setCodeError(null);
  }

  function handleFindDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedCode = agentPairingUserCodeSchema.safeParse(enteredCode);
    if (!parsedCode.success) {
      setCodeError('Saisis les 8 caractères affichés dans l’application PairDock.');
      return;
    }
    openDeveloperAgents(parsedCode.data);
  }

  function handleApprove() {
    if (pairing && !approveMutation.isPending) {
      approveMutation.mutate(pairing.userCode);
    }
  }

  function handleFinish() {
    openDeveloperAgents();
  }

  function handleRetry() {
    void pairingQuery.refetch();
  }

  if (approveMutation.isSuccess) {
    return (
      <SectionCard title="Appareil autorisé">
        <p className="max-w-prose text-sm leading-6 text-[#aeb5c3]" role="status">
          Retourne dans l’application PairDock pour choisir ton dépôt local. L’appareil apparaîtra en ligne dès sa
          connexion.
        </p>
        <Button className="mt-4" onClick={handleFinish}>
          Terminer
        </Button>
      </SectionCard>
    );
  }

  if (!userCode) {
    return (
      <SectionCard
        title="Associer un appareil"
        description="Ouvre PairDock sur ton Mac, puis clique sur Continuer dans le navigateur."
      >
        <p className="mb-4 max-w-prose text-sm leading-6 text-[#aeb5c3]">
          L’application ouvre cette page avec un code à vérifier. Tu peux aussi saisir le code ici.
        </p>
        <form className="flex max-w-md flex-wrap items-end gap-3" onSubmit={handleFindDevice}>
          <label className="min-w-0 flex-1 space-y-2 text-sm text-[#cdd2dc]" htmlFor="agent-pairing-code">
            <span className="block">Code de l’appareil</span>
            <TextInput
              aria-describedby={codeError ? 'agent-code-error' : undefined}
              aria-invalid={Boolean(codeError)}
              autoCapitalize="characters"
              autoComplete="off"
              className="font-mono uppercase tracking-widest"
              id="agent-pairing-code"
              maxLength={9}
              onChange={handleCodeChange}
              placeholder="ABCD-2345"
              required
              value={enteredCode}
            />
          </label>
          <Button type="submit" variant="secondary">
            Vérifier le code
          </Button>
        </form>
        {codeError ? (
          <p className="mt-3 text-sm text-rose-300" id="agent-code-error" role="alert">
            {codeError}
          </p>
        ) : null}
      </SectionCard>
    );
  }

  if (pairingQuery.isPending) {
    return (
      <SectionCard title="Vérification de l’appareil">
        <p className="text-sm text-[#aeb5c3]" role="status">
          Lecture de la demande d’association…
        </p>
      </SectionCard>
    );
  }

  if (pairingQuery.isError || !pairing) {
    return (
      <SectionCard title="Association indisponible">
        <p className="text-sm text-rose-300" role="alert">
          {pairingQuery.error?.message ?? 'La demande est introuvable.'}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-6 text-[#aeb5c3]">
          Si le code a expiré ou a déjà été utilisé, relance l’association dans l’application PairDock.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleRetry} variant="secondary">
            Réessayer
          </Button>
          <Button onClick={handleFinish} variant="ghost">
            Saisir un autre code
          </Button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Autoriser cet appareil"
      description="Vérifie que ce nom et ce code correspondent à ceux affichés dans ton application PairDock."
    >
      <dl className="my-5 space-y-4">
        <div>
          <dt className="text-xs text-[#aeb5c3]">Appareil</dt>
          <dd className="mt-1 break-words text-lg font-semibold">{pairing.deviceName}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#aeb5c3]">Code de vérification</dt>
          <dd className="mt-1 font-mono text-2xl font-semibold tracking-[0.12em] text-[#5fdf9b]">{pairing.userCode}</dd>
        </div>
      </dl>
      <p className="max-w-prose text-sm leading-6 text-[#aeb5c3]">
        Cet appareil sera associé à ton compte développeur. Il pourra exécuter les sessions des projets que tu lui
        confies.
      </p>
      <p className="mt-2 text-xs text-[#aeb5c3]">
        Code valable jusqu’à{' '}
        <time dateTime={pairing.expiresAt}>{new Date(pairing.expiresAt).toLocaleTimeString()}</time>.
      </p>
      {approveMutation.isError ? (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {approveMutation.error.message}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button disabled={approveMutation.isPending} onClick={handleApprove}>
          {approveMutation.isPending ? 'Autorisation…' : 'Autoriser cet appareil'}
        </Button>
        <Button disabled={approveMutation.isPending} onClick={handleFinish} variant="ghost">
          Annuler
        </Button>
      </div>
    </SectionCard>
  );
}
