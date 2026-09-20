import type { SessionView, ValidationSummaryView } from '../schemas/session.js';

export interface SessionValidationCheck {
  label: string;
  status: 'passed' | 'failed' | 'skipped' | 'unknown';
  detail: string;
}

export function describeSessionValidation(validation: ValidationSummaryView | null, sessionStatus: string) {
  const checks: SessionValidationCheck[] = [
    describeCheck('Compilation', validation?.buildStatus),
    describeCheck('Tests', validation?.testStatus),
    describeCheck('Analyse du code', validation?.lintStatus),
    describeCheck('Aperçu', validation?.previewStatus),
  ];
  let summary = 'Aucun résultat de validation reçu.';
  if (validation) {
    if (validation.status === 'failed' || checks.some((check) => check.status === 'failed')) {
      summary = 'Des contrôles ont échoué.';
    } else if (checks.every((check) => check.status === 'passed')) {
      summary = 'Tous les contrôles ont réussi.';
    } else {
      summary = 'La validation est incomplète.';
    }
  }

  let notice: string | null = null;
  if (sessionStatus === 'AGENT_RUNNING' || sessionStatus === 'CHECKS_RUNNING') {
    notice = 'Travail en cours : ces derniers résultats ne valident pas encore les nouvelles modifications.';
  } else if (sessionStatus === 'FAILED') {
    notice = 'La dernière demande a échoué. Ces contrôles ne suffisent pas à valider son résultat.';
  }
  return { checks, summary, notice };
}

function describeCheck(label: string, status: string | null | undefined): SessionValidationCheck {
  if (status === 'passed') return { label, status, detail: 'Réussi' };
  if (status === 'failed') return { label, status, detail: 'Échoué' };
  if (status === 'skipped') return { label, status, detail: 'Non exécuté' };
  return { label, status: 'unknown', detail: status ? `Statut inconnu : ${status}` : 'Non renseigné' };
}

export function getReviewRequestBlockedReason(session: SessionView, isReadOnly: boolean): string | null {
  if (isReadOnly) return 'La création d’une PR est réservée aux participants autorisés de la session.';
  if (session.reviewRequest?.url) return 'Une PR existe déjà pour cette session.';
  if (session.status === 'CLOSED' || session.status === 'CLOSING')
    return 'Cette session est terminée ou en cours de fermeture.';
  if (session.project.agentAvailability !== 'online')
    return 'L’agent est hors ligne. Attends sa reconnexion pour créer la PR.';
  if (session.status !== 'AWAITING_PM_VALIDATION')
    return 'La PR sera disponible lorsque le travail et ses contrôles seront terminés.';
  const validation = describeSessionValidation(session.latestValidation, session.status);
  if (!session.latestValidation || !validation.checks.every((check) => check.status === 'passed')) {
    return 'La compilation, les tests, l’analyse du code et l’aperçu doivent réussir avant la création de la PR.';
  }
  return null;
}
