const sessionStatusLabels: Record<string, string> = {
  CREATED: 'Préparation de la session',
  AGENT_CONNECTING: 'Connexion à l’agent',
  WORKTREE_CREATING: 'Création de l’espace de travail',
  DOCKER_STARTING: 'Démarrage de la preview',
  PREVIEW_STARTING: 'Démarrage de la preview',
  READY: 'Prêt pour ta demande',
  AGENT_RUNNING: 'L’agent travaille',
  CHECKS_RUNNING: 'Vérification du travail',
  AWAITING_PM_VALIDATION: 'Prêt à être validé',
  REVIEW_REQUEST_CREATING: 'Création de la pull request',
  REVIEW_REQUEST_CREATED: 'Pull request créée',
  CLOSING: 'Fermeture de la session',
  FAILED: 'La demande a rencontré une erreur',
  CLOSED: 'Session terminée',
};

const sessionDateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function formatSessionStatus(status: string): string {
  return sessionStatusLabels[status] ?? 'État indisponible';
}

export function formatSessionCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? 'Date indisponible' : sessionDateFormatter.format(date);
}
