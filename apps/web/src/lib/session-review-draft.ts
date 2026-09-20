import type { CreateReviewRequestInput } from '@pairdock/shared-contracts';
import type { ValidationSummaryView } from '../schemas/session.js';
import { parsePreviewSelectionPrompt } from './preview-selection-prompt.js';
import type { SessionConversationItem } from './session-conversation.js';
import { describeSessionValidation } from './session-validation.js';

interface SessionReviewDraftInput {
  projectName: string;
  conversation: SessionConversationItem[];
  changedFiles: string[] | null;
  sessionStatus: string;
  validation: ValidationSummaryView | null;
}

export function buildSessionReviewDraft(input: SessionReviewDraftInput): CreateReviewRequestInput {
  const requests = input.conversation
    .filter((item) => item.role === 'user' && item.kind === 'message')
    .map((item) => (parsePreviewSelectionPrompt(item.text)?.content ?? item.text).trim())
    .filter(Boolean);
  const firstRequest = requests[0] ?? `Modifications de ${input.projectName}`;
  const title = shorten(firstRequest.replace(/\s+/g, ' '), 120);
  let requestSummary = 'Décrire le besoin et le résultat à vérifier.';
  if (requests.length) {
    requestSummary = shorten(requests.map((request) => `- ${request.replace(/\s+/g, ' ')}`).join('\n'), 4_000);
  }
  let filesSummary = 'Diff non reçu : vérifier les fichiers modifiés avant envoi.';
  if (input.changedFiles) {
    filesSummary = 'Aucun fichier modifié dans le dernier diff.';
    if (input.changedFiles.length) {
      filesSummary = shorten(input.changedFiles.map((file) => `- ${file.replace(/[\r\n]/g, ' ')}`).join('\n'), 3_000);
    }
  }
  const validation = describeSessionValidation(input.validation, input.sessionStatus);
  const validationLines = validation.checks.map((check) => `- ${check.label} : ${check.detail}`);
  const description = [
    '## Demandes de la session',
    requestSummary,
    '## Fichiers modifiés (dernier diff)',
    filesSummary,
    '## Derniers contrôles reçus',
    validation.summary,
    validationLines.join('\n'),
    validation.notice,
    '## Vérification visuelle',
    'À compléter : résultat observé dans l’aperçu et points restant à vérifier.',
  ]
    .filter(Boolean)
    .join('\n\n');
  return { type: 'feat', title, description: shorten(description, 10_000) };
}

function shorten(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}
