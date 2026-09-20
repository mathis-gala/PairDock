import type { DeveloperProjectSetup, DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { Button } from '../button.js';

interface DeveloperOnboardingJourneyProps {
  isVerifying: boolean;
  onCreateProject: () => void;
  project: DeveloperProjectSummary | null;
  setup: DeveloperProjectSetup | null;
}

export function DeveloperOnboardingJourney({
  isVerifying,
  onCreateProject,
  project,
  setup,
}: DeveloperOnboardingJourneyProps) {
  const connected = project ? project.agentAvailability === 'online' : Boolean(setup?.agents.length);
  const verified = !isVerifying && (project?.readiness?.ok ?? false);
  let verificationDetail = 'Vérifie les outils et la preview.';
  if (isVerifying) verificationDetail = 'Vérification en cours…';
  else if (verified) verificationDetail = 'Vérifications réussies';
  const steps = [
    { label: 'Connecter', done: connected, detail: connected ? 'Appareil en ligne' : 'Ouvre PairDock sur ton Mac.' },
    { label: 'Projet', done: Boolean(project), detail: project?.name ?? 'Choisis ton dépôt local.' },
    {
      label: 'Vérifier',
      done: verified,
      detail: verificationDetail,
    },
    { label: 'Inviter', done: Boolean(project?.pmMemberCount), detail: 'Donne accès à un PM de ton équipe.' },
  ];
  const currentStep = steps.findIndex((step) => !step.done);

  function handleStep(step: number) {
    if (step === 0) {
      window.location.hash = '#/developer/agents';
      return;
    }
    if (!project) {
      onCreateProject();
      return;
    }
    let target = `developer-project-${project.id}`;
    if (step === 2) target += '-readiness';
    if (step === 3) target += '-invite';
    const element = document.getElementById(target);
    element?.scrollIntoView({ block: 'start' });
    element?.focus({ preventScroll: true });
  }

  return (
    <section aria-label="Préparation du projet" className="mb-6 border-y border-white/10 py-5">
      <h2 className="mb-4 text-sm font-semibold text-[#eef0f4]">
        {project
          ? `${currentStep === -1 ? 'Configuration terminée' : 'Prochaine étape'} pour ${project.name}`
          : 'Préparer un projet, en quatre étapes'}
      </h2>
      <ol className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {steps.map((step, index) => (
          <li aria-current={currentStep === index ? 'step' : undefined} key={step.label}>
            <Button
              className="min-h-11 w-full justify-start px-3"
              disabled={!project && index > 1}
              onClick={() => handleStep(index)}
              variant={currentStep === index ? 'primary' : 'secondary'}
            >
              <span aria-hidden="true">{step.done ? '✓' : `${index + 1}.`}</span>
              {step.label}
              {step.done ? <span className="sr-only"> : terminé</span> : null}
            </Button>
            <p className="mt-2 text-xs leading-5 text-[#aeb5c3]">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
