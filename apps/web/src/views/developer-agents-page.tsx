import { Button } from '../components/button.js';
import { AgentPairingPanel } from '../components/developer/agent-pairing-panel.js';
import { DeveloperAgentRow } from '../components/developer/developer-agent-row.js';
import { ProductShell } from '../components/product-shell.js';
import { SectionCard } from '../components/section-card.js';
import { useDeveloperAgents } from '../hooks/use-developer-agents.js';
import type { AuthSession } from '../schemas/auth.js';

interface DeveloperAgentsPageProps {
  onSignOut: () => void;
  session: AuthSession;
  userCode: string | null;
}

const navItems = [
  { active: false, href: '#/developer', label: 'Projets' },
  { active: true, href: '#/developer/agents', label: 'Agents' },
];

export function DeveloperAgentsPage({ onSignOut, session, userCode }: DeveloperAgentsPageProps) {
  const { agentsQuery, revokeMutation } = useDeveloperAgents(session.accessToken);
  const agents = agentsQuery.data ?? [];

  function handleRetry() {
    void agentsQuery.refetch();
  }

  function handleRevoke(agentId: string) {
    revokeMutation.mutate(agentId);
  }

  return (
    <ProductShell navItems={navItems} onSignOut={onSignOut} user={session.user} viewLabel="Agents">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-9">
        <header className="mb-7">
          <h1 className="font-['Space_Grotesk'] text-2xl font-semibold">Agents</h1>
          <p className="mt-2 max-w-prose text-sm leading-6 text-[#aeb5c3]">
            Associe l’application PairDock à ton compte pour utiliser tes dépôts locaux dans tes projets.
          </p>
        </header>
        <AgentPairingPanel accessToken={session.accessToken} key={userCode ?? 'new'} userCode={userCode} />
        <section aria-labelledby="developer-agents-title" className="mt-9">
          <h2 className="font-['Space_Grotesk'] text-lg font-semibold" id="developer-agents-title">
            Mes appareils
          </h2>
          <p className="mb-5 mt-1 text-sm text-[#aeb5c3]">
            Seuls les appareils associés à ton compte apparaissent ici.
          </p>
          {agentsQuery.isPending ? (
            <p className="rounded-[10px] border border-white/10 p-5 text-sm text-[#aeb5c3]" role="status">
              Chargement des appareils…
            </p>
          ) : null}
          {agentsQuery.isError ? (
            <div className="mb-5 space-y-3">
              <p className="text-sm text-rose-300" role="alert">
                {agentsQuery.error.message}
              </p>
              <Button onClick={handleRetry} variant="secondary">
                Réessayer
              </Button>
            </div>
          ) : null}
          {revokeMutation.isSuccess ? (
            <p className="mb-4 text-sm text-[#aeb5c3]" role="status">
              Accès révoqué. Cet appareil doit être associé de nouveau pour se reconnecter.
            </p>
          ) : null}
          {agents.length > 0 ? (
            <ul className="divide-y divide-white/10 rounded-[14px] border border-white/10 bg-[#191c23] p-5">
              {agents.map((agent) => (
                <DeveloperAgentRow
                  agent={agent}
                  errorMessage={
                    revokeMutation.variables === agent.agentId ? (revokeMutation.error?.message ?? null) : null
                  }
                  isRevoking={revokeMutation.isPending && revokeMutation.variables === agent.agentId}
                  key={agent.agentId}
                  onRevoke={handleRevoke}
                />
              ))}
            </ul>
          ) : null}
          {!agentsQuery.isPending && !agentsQuery.isError && agents.length === 0 ? (
            <SectionCard
              title="Aucun appareil associé"
              description="Commence par ouvrir l’application PairDock sur ton Mac et associer ton compte. Tu pourras ensuite sélectionner un dépôt avec le sélecteur de dossiers de l’application."
            />
          ) : null}
        </section>
        <p className="mt-6 max-w-prose text-sm leading-6 text-[#aeb5c3]">
          Une fois ton dépôt ajouté dans l’application, retrouve-le dans{' '}
          <a className="text-[#5fdf9b] underline underline-offset-4" href="#/developer">
            Projets
          </a>{' '}
          pour choisir le modèle et inviter ton équipe.
        </p>
      </div>
    </ProductShell>
  );
}
