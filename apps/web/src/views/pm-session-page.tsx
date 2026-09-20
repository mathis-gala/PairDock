import {
  type CreateReviewRequestInput,
  isPromptableSessionStatus,
  PREVIEW_SELECTION_LIMITS,
  type PreviewElementSelection,
} from '@pairdock/shared-contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Button } from '../components/button.js';
import { ConversationThread } from '../components/pm-session/conversation-thread.js';
import { PreviewComparisonPanel } from '../components/pm-session/preview-comparison-panel.js';
import { PreviewFrame } from '../components/pm-session/preview-frame.js';
import { type PreviewSelectionControls, PreviewToolbar } from '../components/pm-session/preview-toolbar.js';
import { PromptComposer } from '../components/pm-session/prompt-composer.js';
import { ReviewRequestDialog } from '../components/pm-session/review-request-dialog.js';
import { SessionValidationSummary } from '../components/pm-session/session-validation-summary.js';
import { SectionCard } from '../components/section-card.js';
import { usePreviewSelection } from '../hooks/use-preview-selection.js';
import { useSessionData } from '../hooks/use-session-data.js';
import type { PreviewPresetId } from '../lib/preview-presets.js';
import { buildSessionConversation, type SessionConversationItem } from '../lib/session-conversation.js';
import { formatSessionStatus } from '../lib/session-labels.js';
import { sessionQueryKeys } from '../lib/session-query-keys.js';
import { buildSessionReviewDraft } from '../lib/session-review-draft.js';
import { getReviewRequestBlockedReason } from '../lib/session-validation.js';
import type { SessionEventRecordView, SessionMessageView, SessionView } from '../schemas/session.js';

interface PmSessionPageProps {
  accessToken: string;
  isReadOnly?: boolean;
  onBack: () => void;
  sessionId: string;
}

export function PmSessionPage(props: PmSessionPageProps) {
  return <PmSessionWorkspace key={`${props.accessToken}:${props.sessionId}:${props.isReadOnly ?? false}`} {...props} />;
}

function PmSessionWorkspace({ accessToken, isReadOnly = false, onBack, sessionId }: PmSessionPageProps) {
  const queryClient = useQueryClient();
  const [presetId, setPresetId] = useState<PreviewPresetId>('desktop');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<CreateReviewRequestInput | undefined>();
  const [reviewScreenshots, setReviewScreenshots] = useState<File[]>([]);
  const [mobilePanel, setMobilePanel] = useState<'discussion' | 'preview'>('discussion');
  const [previewMode, setPreviewMode] = useState<'live' | 'comparison'>('live');
  const [hasOpenedComparison, setHasOpenedComparison] = useState(false);
  const [selections, setSelections] = useState<PreviewElementSelection[]>([]);
  const handleSelectElement = useCallback((selection: PreviewElementSelection) => {
    setSelections((current) => {
      const existingIndex = current.findIndex(
        (item) => item.url === selection.url && item.selector === selection.selector,
      );
      if (existingIndex !== -1) {
        return current.map((item, index) => (index === existingIndex ? selection : item));
      }
      if (current.length >= PREVIEW_SELECTION_LIMITS.selections) {
        return current;
      }
      return [...current, selection];
    });
    setMobilePanel('discussion');
    requestAnimationFrame(() => document.getElementById('pm-session-prompt')?.focus());
  }, []);
  const {
    snapshot,
    isSending,
    isCancelling,
    isCreatingReviewRequest,
    reviewRequestError,
    sendPrompt,
    cancelPrompt,
    createReviewRequest,
    resetReviewRequest,
  } = useSessionData(accessToken, sessionId);
  const hasSelectionLimit = selections.length >= PREVIEW_SELECTION_LIMITS.selections;
  const isSessionClosed =
    snapshot.status === 'ready' && (snapshot.session.status === 'CLOSED' || snapshot.session.status === 'CLOSING');
  const previewUrl = snapshot.status === 'ready' && !isSessionClosed ? snapshot.session.previewUrl : null;
  const canSelectElements =
    !isReadOnly && !isSending && !hasSelectionLimit && !isSessionClosed && previewMode === 'live';
  const previewSelection = usePreviewSelection(previewUrl, canSelectElements, handleSelectElement);

  if (snapshot.status === 'loading') {
    return (
      <div className="p-8">
        <SectionCard title="Chargement de la session" description="Récupération de la conversation et de l’aperçu." />
      </div>
    );
  }

  if (snapshot.status === 'error') {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <SectionCard
          actions={
            <Button onClick={onBack} variant="secondary">
              Retour au tableau de bord
            </Button>
          }
          title="Impossible de charger la session"
          description={snapshot.error.message}
        />
      </div>
    );
  }

  const { session, conversation } = snapshot;
  const canCancel = !isReadOnly && session.status === 'AGENT_RUNNING';
  const isAgentWriting = isSending || session.status === 'AGENT_RUNNING';
  const branchLabel = session.branchName ?? session.project.defaultBranch;
  const participantAvatars = session.participants.slice(0, 2).map((participant) => ({
    initial: participant.displayName.slice(0, 1),
    userId: participant.userId,
  }));
  const isOnline = session.project.agentAvailability === 'online';
  const canSubmitPrompt = !isReadOnly && isOnline && isPromptableSessionStatus(session.status);
  const promptBlockedReason = getPromptBlockedReason(session.status, isOnline);
  const hasFailed = session.status === 'FAILED';
  let failureRecoveryMessage =
    'La session n’a pas pu être préparée. Ferme-la puis crée une nouvelle session après correction.';
  if (!isOnline) failureRecoveryMessage = 'Le développeur doit reconnecter son agent avant de réessayer.';
  else if (session.previewUrl) failureRecoveryMessage = 'Tu peux envoyer un nouveau message pour réessayer.';
  const reviewBlockedReason = getReviewRequestBlockedReason(session, isReadOnly);
  const canCreateReviewRequest = reviewBlockedReason === null;
  const isStatusWarning = !isOnline || session.status === 'CLOSED' || session.status === 'CLOSING';
  let statusColor = 'text-[#a3aab8]';
  if (hasFailed) statusColor = 'text-rose-300';
  else if (isStatusWarning) statusColor = 'text-amber-200';
  else if (session.status === 'AWAITING_PM_VALIDATION' || session.status === 'REVIEW_REQUEST_CREATED')
    statusColor = 'text-[#a9efc9]';
  let selectionDisabledReason: string | null = null;
  if (isSessionClosed) {
    selectionDisabledReason = 'La sélection n’est plus disponible dans une session fermée.';
  } else if (hasSelectionLimit) {
    selectionDisabledReason = `Limite de ${PREVIEW_SELECTION_LIMITS.selections} éléments atteinte. Retire une sélection pour en ajouter une autre.`;
  } else if (isSending) {
    selectionDisabledReason = 'Envoi du message en cours…';
  }
  let selectionControls: PreviewSelectionControls | undefined;
  if (!isReadOnly) {
    selectionControls = {
      state: previewSelection.snapshot,
      disabledReason: selectionDisabledReason,
      onToggle: previewSelection.toggleSelection,
      onRetry: previewSelection.retryConnection,
    };
  }
  const discussionClassName = `${mobilePanel === 'discussion' ? 'flex' : 'hidden'} min-h-0 w-full flex-none flex-col border-r border-white/10 bg-[#15171c] lg:flex lg:w-[42%] lg:max-w-[560px]`;
  const previewClassName = `${mobilePanel === 'preview' ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col bg-[#0f1115] lg:flex`;

  function handleShowDiscussion() {
    setMobilePanel('discussion');
  }

  function handleShowPreview() {
    setMobilePanel('preview');
  }

  function handleShowLivePreview() {
    setPreviewMode('live');
  }

  function handleShowComparison() {
    setHasOpenedComparison(true);
    setPreviewMode('comparison');
  }

  async function handleCancelPrompt() {
    await cancelPrompt();
  }

  async function handleSendPrompt(content: string, screenshots: File[]) {
    await sendPrompt({ content, screenshots });
  }

  function handleOpenReviewDialog() {
    if (!canCreateReviewRequest) return;
    openReviewDialog([], session, conversation);
  }

  function handleUseComparisonInReview(files: File[]) {
    const currentSession = queryClient.getQueryData<SessionView>(sessionQueryKeys.detail(accessToken, sessionId));
    if (!currentSession) throw new Error('La session est indisponible. Recharge-la avant de préparer la PR.');
    const blockedReason = getReviewRequestBlockedReason(currentSession, isReadOnly);
    if (blockedReason) throw new Error(blockedReason);
    const messages =
      queryClient.getQueryData<SessionMessageView[]>(sessionQueryKeys.messages(accessToken, sessionId)) ?? [];
    const events =
      queryClient.getQueryData<SessionEventRecordView[]>(sessionQueryKeys.events(accessToken, sessionId)) ?? [];
    openReviewDialog(files, currentSession, buildSessionConversation(messages, events));
  }

  function openReviewDialog(
    files: File[],
    currentSession: SessionView,
    currentConversation: SessionConversationItem[],
  ) {
    resetReviewRequest();
    setReviewScreenshots(files);
    setReviewDraft(
      buildSessionReviewDraft({
        projectName: currentSession.project.name,
        conversation: currentConversation,
        changedFiles: currentSession.latestDiff?.changedFiles ?? null,
        sessionStatus: currentSession.status,
        validation: currentSession.latestValidation,
      }),
    );
    setIsReviewDialogOpen(true);
  }

  function handleCloseReviewDialog() {
    if (!isCreatingReviewRequest) {
      setIsReviewDialogOpen(false);
      setReviewScreenshots([]);
    }
  }

  async function handleCreateReviewRequest(input: CreateReviewRequestInput, screenshots: File[]) {
    if (reviewBlockedReason) throw new Error(reviewBlockedReason);
    resetReviewRequest();
    await createReviewRequest({ input, screenshots });
    setIsReviewDialogOpen(false);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0f1115]">
      <header className="flex h-14 flex-none items-center gap-4 border-b border-white/10 bg-[#16181e] px-4">
        <button
          aria-label={isReadOnly ? 'Retour aux projets' : 'Retour au tableau de bord'}
          className="flex size-8 items-center justify-center rounded-[8px] border border-white/10 bg-[#0f1115] text-[#8b92a1] transition hover:text-[#eef0f4]"
          onClick={onBack}
          type="button"
        >
          ←
        </button>
        <span className="flex size-5 items-center justify-center rounded-[5px] bg-[#5fdf9b] text-[#0c2014]">
          <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 24 24">
            <path
              d="M9.2 8 6.4 12l2.8 4M14.8 8l2.8 4-2.8 4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </span>
        <div className="flex min-w-0 items-center gap-2 font-mono text-[12.5px] text-[#a3aab8]">
          <span className="truncate font-medium text-[#eef0f4]">{session.project.name}</span>
          <span className="text-[#4b515e]">/</span>
          <span className="truncate text-[#5fdf9b]">{branchLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {isReadOnly ? (
            <span className="hidden rounded-full border border-[#5fdf9b]/30 bg-[#5fdf9b]/10 px-2.5 py-1 font-mono text-[11px] text-[#a9efc9] sm:inline-flex">
              Lecture seule
            </span>
          ) : null}
          <div className="hidden items-center gap-2 text-[12.5px] text-[#8b92a1] sm:flex">
            <span className="flex">
              {participantAvatars.map((participant, index) => (
                <span
                  className="flex size-6 items-center justify-center rounded-[7px] border-2 border-[#16181e] text-[11px] font-semibold"
                  key={participant.userId}
                  style={{
                    backgroundColor: index === 0 ? '#5a3d7a' : '#2f7a52',
                    color: index === 0 ? '#f0e3fa' : '#eafff3',
                    marginLeft: index === 0 ? 0 : -7,
                  }}
                >
                  {participant.initial}
                </span>
              ))}
            </span>
            agent de {session.project.ownerDisplayName}
          </div>
          <span
            aria-live="polite"
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-xs ${isOnline ? 'text-[#a9efc9]' : 'text-amber-200'}`}
            role="status"
          >
            <span aria-hidden="true" className="size-[7px] rounded-full bg-current" />
            {isOnline ? 'en ligne' : 'hors ligne'}
          </span>
        </div>
      </header>

      <nav
        aria-label="Vue de la session"
        className="flex flex-none gap-2 border-b border-white/10 bg-[#15171c] px-4 py-1 lg:hidden"
      >
        <Button
          aria-controls="pm-session-discussion"
          aria-pressed={mobilePanel === 'discussion'}
          className="min-h-11 flex-1 text-xs"
          onClick={handleShowDiscussion}
          variant={mobilePanel === 'discussion' ? 'primary' : 'secondary'}
        >
          Discussion{selections.length > 0 ? ` · ${selections.length}` : ''}
        </Button>
        <Button
          aria-controls="pm-session-preview"
          aria-pressed={mobilePanel === 'preview'}
          className="min-h-11 flex-1 text-xs"
          onClick={handleShowPreview}
          variant={mobilePanel === 'preview' ? 'primary' : 'secondary'}
        >
          Aperçu
        </Button>
      </nav>

      <div className="flex min-h-0 flex-1">
        <section className={discussionClassName} id="pm-session-discussion">
          <div className="border-b border-white/10 px-5 py-4">
            <h1 className="font-['Space_Grotesk'] text-sm font-semibold">Discussion</h1>
            <p className="mt-1 text-xs leading-5 text-[#7d8493]">
              {isReadOnly
                ? 'Conversation, captures et progression visibles pour faciliter le diagnostic.'
                : 'Une demande = une session isolée. Tu peux échanger avec l’agent jusqu’à validation.'}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <ConversationThread
              accessToken={accessToken}
              isTyping={isAgentWriting}
              items={conversation}
              sessionId={sessionId}
            />
          </div>
          {isReadOnly ? (
            <div className="border-t border-white/10 p-4">
              <div
                className="rounded-[11px] border border-[#5fdf9b]/20 bg-[#5fdf9b]/8 px-3.5 py-3 text-xs leading-5 text-[#a9efc9]"
                role="status"
              >
                Vue développeur en lecture seule. Reviens aux projets pour fermer ou nettoyer cette session.
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 p-4">
              <PromptComposer
                blockedReason={promptBlockedReason}
                canCancel={canCancel}
                canSubmit={canSubmitPrompt}
                isCancelling={isCancelling}
                isSubmitting={isSending}
                onCancel={handleCancelPrompt}
                onSelectionsChange={setSelections}
                onSubmit={handleSendPrompt}
                selections={selections}
              />
            </div>
          )}
        </section>

        <section className={previewClassName} id="pm-session-preview">
          <div className="hidden h-[46px] flex-none items-center gap-3 border-b border-white/10 bg-[#1a1d24] px-3.5 sm:flex">
            <div className="flex gap-1.5">
              <span className="size-[11px] rounded-full bg-[#ec6a5e]" />
              <span className="size-[11px] rounded-full bg-[#f4bf4f]" />
              <span className="size-[11px] rounded-full bg-[#61c554]" />
            </div>
            <div className="flex h-7 min-w-0 max-w-[520px] flex-1 items-center gap-2 rounded-[8px] border border-white/10 bg-[#0f1115] px-3 font-mono text-[11.5px] text-[#8b92a1]">
              <span className="text-[#5fdf9b]">⌁</span>
              <span className="truncate">{previewUrl ?? 'Aucun aperçu disponible'}</span>
              <span className="ml-auto hidden text-[#8b92a1] sm:inline">session isolée</span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#7d8493]">formats</span>
          </div>
          <fieldset className="flex flex-none gap-2 border-b border-white/10 bg-[#15171c] px-3 py-1">
            <legend className="sr-only">Mode de l’aperçu</legend>
            <Button
              aria-controls="pm-live-preview"
              aria-pressed={previewMode === 'live'}
              className="min-h-11 text-xs"
              onClick={handleShowLivePreview}
              variant={previewMode === 'live' ? 'primary' : 'ghost'}
            >
              Aperçu
            </Button>
            <Button
              aria-controls="pm-preview-comparison"
              aria-pressed={previewMode === 'comparison'}
              className="min-h-11 text-xs"
              onClick={handleShowComparison}
              variant={previewMode === 'comparison' ? 'primary' : 'ghost'}
            >
              Avant / après
            </Button>
          </fieldset>
          <div
            className={`${previewMode === 'live' ? 'block' : 'hidden'} min-h-0 flex-1 overflow-hidden`}
            id="pm-live-preview"
          >
            <PreviewFrame
              agentAvailability={session.project.agentAvailability}
              onFrameRef={previewSelection.attachFrame}
              presetId={presetId}
              previewUrl={previewUrl}
              sessionStatus={session.status}
            />
          </div>
          {hasOpenedComparison ? (
            <div
              className={`${previewMode === 'comparison' ? 'block' : 'hidden'} min-h-0 flex-1 overflow-auto`}
              id="pm-preview-comparison"
            >
              <PreviewComparisonPanel
                accessToken={accessToken}
                sessionId={sessionId}
                previewUrl={previewUrl}
                presetId={presetId}
                readOnly={isReadOnly}
                sessionStatus={session.status}
                onUseInReview={canCreateReviewRequest ? handleUseComparisonInReview : undefined}
              />
            </div>
          ) : null}
          {previewMode === 'live' ? (
            <PreviewToolbar
              onPresetChange={setPresetId}
              presetId={presetId}
              previewUrl={previewUrl}
              selectionControls={selectionControls}
            />
          ) : null}
          <div className="max-h-[32vh] flex-none overflow-auto">
            <SessionValidationSummary
              changedFiles={session.latestDiff?.changedFiles ?? null}
              sessionStatus={isSending ? 'AGENT_RUNNING' : session.status}
              validation={session.latestValidation}
            />
          </div>
          <div className="flex min-h-[62px] flex-none items-center justify-between gap-3 border-t border-white/10 bg-[#16181e] px-3 py-2 sm:gap-4 sm:px-5 sm:py-3">
            <div aria-live="polite" className="min-w-0 font-mono text-[12.5px]" role={hasFailed ? 'alert' : 'status'}>
              <div className={`flex items-center gap-2 ${statusColor}`}>
                <span aria-hidden="true" className="size-[7px] rounded-full bg-current" />
                {formatSessionStatus(session.status)}
              </div>
              {hasFailed && session.lastError ? (
                <p className="mt-1 max-w-[70ch] whitespace-normal font-sans text-xs leading-5 text-rose-100/80">
                  {session.lastError} {failureRecoveryMessage}
                </p>
              ) : null}
              {reviewRequestError ? <div className="mt-1 truncate text-rose-300">{reviewRequestError}</div> : null}
              {!isReadOnly && !session.reviewRequest?.url && reviewBlockedReason ? (
                <p className="mt-1 max-w-[70ch] font-sans text-xs leading-5 text-[#a3aab8]">{reviewBlockedReason}</p>
              ) : null}
            </div>
            {session.reviewRequest?.url ? (
              <a
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#5fdf9b] px-5 text-[13.5px] font-semibold text-[#0c2014]"
                href={session.reviewRequest.url}
                rel="noreferrer"
                target="_blank"
              >
                Voir sur GitHub
              </a>
            ) : isReadOnly ? (
              <span className="rounded-[9px] border border-white/10 bg-[#20232a] px-3 py-2 font-mono text-[11px] text-[#7d8493]">
                Observation uniquement
              </span>
            ) : (
              <Button
                className="shrink-0 whitespace-nowrap max-sm:px-3 max-sm:text-xs"
                disabled={!canCreateReviewRequest || isCreatingReviewRequest}
                onClick={handleOpenReviewDialog}
              >
                Soumettre la PR
              </Button>
            )}
          </div>
        </section>
      </div>
      {isReviewDialogOpen && !isReadOnly ? (
        <ReviewRequestDialog
          blockedReason={reviewBlockedReason}
          error={reviewRequestError}
          initialValues={reviewDraft}
          initialScreenshots={reviewScreenshots}
          isSubmitting={isCreatingReviewRequest}
          onClose={handleCloseReviewDialog}
          onSubmit={handleCreateReviewRequest}
        />
      ) : null}
    </div>
  );
}

function getPromptBlockedReason(status: string, isOnline: boolean): string | null {
  if (status === 'CLOSED' || status === 'CLOSING') return 'Cette session est terminée ou en cours de fermeture.';
  if (!isOnline) {
    return 'L’agent local est hors ligne. Le développeur doit le redémarrer avant le prochain message.';
  }

  const reasons: Record<string, string> = {
    CREATED: 'La session se prépare avant le premier message.',
    AGENT_CONNECTING: 'Connexion à l’agent en cours.',
    WORKTREE_CREATING: 'Création de l’espace de travail en cours.',
    DOCKER_STARTING: 'Démarrage de l’aperçu en cours.',
    PREVIEW_STARTING: 'L’aperçu démarre avant le premier message.',
    AGENT_RUNNING: 'L’agent traite ton message. Tu peux préparer la suite, puis l’envoyer dès qu’il a terminé.',
    CHECKS_RUNNING: 'L’agent vérifie les modifications. Tu pourras envoyer la suite dès la fin des contrôles.',
    REVIEW_REQUEST_CREATING: 'La pull request est en cours de création.',
    REVIEW_REQUEST_CREATED: 'La pull request a été créée pour cette session.',
  };

  return reasons[status] ?? null;
}
