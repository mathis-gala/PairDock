import { type CreateDraftReviewRequestInput, isPromptableSessionStatus } from '@pairdock/shared-contracts';
import { useState } from 'react';
import { Button } from '../components/button.js';
import { ConversationThread } from '../components/pm-session/conversation-thread.js';
import { PreviewFrame } from '../components/pm-session/preview-frame.js';
import { PreviewToolbar } from '../components/pm-session/preview-toolbar.js';
import { PromptComposer } from '../components/pm-session/prompt-composer.js';
import { ReviewRequestDialog } from '../components/pm-session/review-request-dialog.js';
import { SectionCard } from '../components/section-card.js';
import { useSessionData } from '../hooks/use-session-data.js';
import { useSessionEventFeed } from '../hooks/use-session-event-feed.js';
import type { PreviewPresetId } from '../lib/preview-presets.js';
import { buildSessionConversation } from '../lib/session-conversation.js';

interface PmSessionPageProps {
  accessToken: string;
  onBack: () => void;
  sessionId: string;
}

export function PmSessionPage({ accessToken, onBack, sessionId }: PmSessionPageProps) {
  const [presetId, setPresetId] = useState<PreviewPresetId>('desktop');
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  useSessionEventFeed(accessToken, sessionId);
  const {
    sessionQuery,
    messagesQuery,
    eventsQuery,
    sendPromptMutation,
    cancelPromptMutation,
    createReviewRequestMutation,
  } = useSessionData(accessToken, sessionId);

  if (sessionQuery.isLoading || messagesQuery.isLoading || eventsQuery.isLoading) {
    return (
      <div className="p-8">
        <SectionCard title="Chargement de la session" description="Récupération de la conversation et de l’aperçu." />
      </div>
    );
  }

  if (sessionQuery.isError || messagesQuery.isError || eventsQuery.isError || !sessionQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <SectionCard
          actions={
            <Button onClick={onBack} variant="secondary">
              Back to dashboard
            </Button>
          }
          title="Could not load PM session"
          description={
            sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : messagesQuery.error instanceof Error
                ? messagesQuery.error.message
                : eventsQuery.error instanceof Error
                  ? eventsQuery.error.message
                  : 'Request failed.'
          }
        />
      </div>
    );
  }

  const session = sessionQuery.data;
  const canCancel = session.status === 'AGENT_RUNNING';
  const branchLabel = session.branchName ?? session.project.defaultBranch;
  const participantAvatars = session.participants.slice(0, 2).map((participant) => ({
    initial: participant.displayName.slice(0, 1),
    userId: participant.userId,
  }));
  const isOnline = session.project.agentAvailability === 'online';
  const canSubmitPrompt = isOnline && isPromptableSessionStatus(session.status);
  const promptBlockedReason = getPromptBlockedReason(session.status, isOnline);
  const hasFailed = session.status === 'FAILED';
  const failureRecoveryMessage = session.previewUrl
    ? 'Tu peux envoyer un nouveau message pour réessayer.'
    : 'La session n’a pas pu être préparée. Ferme-la puis crée une nouvelle session après correction.';
  const canCreateReviewRequest = session.status === 'AWAITING_PM_VALIDATION' && !session.reviewRequest?.url;
  const reviewRequestError =
    createReviewRequestMutation.error instanceof Error ? createReviewRequestMutation.error.message : null;
  const conversation = buildSessionConversation(messagesQuery.data ?? [], eventsQuery.data ?? []);

  async function handleCancelPrompt() {
    await cancelPromptMutation.mutateAsync();
  }

  async function handleSendPrompt(content: string) {
    await sendPromptMutation.mutateAsync(content);
  }

  function handleOpenReviewDialog() {
    createReviewRequestMutation.reset();
    setIsReviewDialogOpen(true);
  }

  function handleCloseReviewDialog() {
    if (!createReviewRequestMutation.isPending) {
      setIsReviewDialogOpen(false);
    }
  }

  function handleCreateReviewRequest(input: CreateDraftReviewRequestInput) {
    createReviewRequestMutation.reset();
    createReviewRequestMutation.mutate(input, {
      onSuccess: () => setIsReviewDialogOpen(false),
    });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f1f3f5]">
      <header className="flex h-14 flex-none items-center gap-4 border-b border-black/10 bg-[#ffffff] px-4">
        <button
          className="flex size-8 items-center justify-center rounded-[8px] border border-black/10 bg-[#f1f3f5] text-[#5e6878] transition hover:text-[#20242b]"
          onClick={onBack}
          type="button"
        >
          ←
        </button>
        <span className="flex size-5 items-center justify-center rounded-[5px] bg-[#16834f] text-[#f7faf8]">
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
        <div className="flex min-w-0 items-center gap-2 font-mono text-[12.5px] text-[#5e6878]">
          <span className="truncate font-medium text-[#20242b]">{session.project.name}</span>
          <span className="text-[#8a94a3]">/</span>
          <span className="truncate text-[#16834f]">{branchLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-2 text-[12.5px] text-[#5e6878] sm:flex">
            <span className="flex">
              {participantAvatars.map((participant, index) => (
                <span
                  className="flex size-6 items-center justify-center rounded-[7px] border-2 border-[#ffffff] text-[11px] font-semibold"
                  key={participant.userId}
                  style={{
                    backgroundColor: index === 0 ? '#eadcf2' : '#d8f0df',
                    color: index === 0 ? '#5b2d72' : '#14532d',
                    marginLeft: index === 0 ? 0 : -7,
                  }}
                >
                  {participant.initial}
                </span>
              ))}
            </span>
            agent de {session.project.ownerDisplayName}
          </div>
          <span className="flex items-center gap-1.5 font-mono text-xs text-[#16834f]">
            <span className="size-[7px] rounded-full bg-[#16834f] [animation:pd-pulse_2s_infinite]" />
            {isOnline ? 'en ligne' : 'hors ligne'}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex w-full flex-none flex-col border-r border-black/10 bg-[#ffffff] lg:w-[42%] lg:max-w-[560px]">
          <div className="border-b border-black/10 px-5 py-4">
            <h1 className="font-['Space_Grotesk'] text-sm font-semibold">Discussion</h1>
            <p className="mt-1 text-xs leading-5 text-[#657080]">
              Une demande = une session isolée. Tu peux échanger avec l’agent jusqu’à validation.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <ConversationThread items={conversation} />
          </div>
          <div className="border-t border-black/10 p-4">
            <PromptComposer
              blockedReason={promptBlockedReason}
              canCancel={canCancel}
              canSubmit={canSubmitPrompt}
              isCancelling={cancelPromptMutation.isPending}
              isSubmitting={sendPromptMutation.isPending}
              onCancel={handleCancelPrompt}
              onSubmit={handleSendPrompt}
            />
          </div>
        </section>

        <section className="hidden min-w-0 flex-1 flex-col bg-[#f1f3f5] lg:flex">
          <div className="flex h-[46px] flex-none items-center gap-3 border-b border-black/10 bg-[#eef1f4] px-3.5">
            <div className="flex gap-1.5">
              <span className="size-[11px] rounded-full bg-[#ec6a5e]" />
              <span className="size-[11px] rounded-full bg-[#f4bf4f]" />
              <span className="size-[11px] rounded-full bg-[#61c554]" />
            </div>
            <div className="flex h-7 max-w-[520px] flex-1 items-center gap-2 rounded-[8px] border border-black/10 bg-[#f1f3f5] px-3 font-mono text-[11.5px] text-[#5e6878]">
              <span className="text-[#16834f]">⌁</span>
              {session.previewUrl ?? 'preview non publiée'}
              <span className="ml-auto text-[#7a8494]">worktree</span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#657080]">
              <span className="size-1.5 rounded-full bg-[#16834f]" />
              responsive
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <PreviewFrame presetId={presetId} previewUrl={session.previewUrl} />
          </div>
          <PreviewToolbar onPresetChange={setPresetId} presetId={presetId} previewUrl={session.previewUrl} />
          <div className="flex min-h-[62px] flex-none items-center justify-between gap-4 border-t border-black/10 bg-[#ffffff] px-5 py-3">
            <div aria-live="polite" className="min-w-0 font-mono text-[12.5px]" role={hasFailed ? 'alert' : 'status'}>
              <div
                className={
                  hasFailed ? 'flex items-center gap-2 text-[#b4233b]' : 'flex items-center gap-2 text-[#16834f]'
                }
              >
                <span
                  className={
                    hasFailed ? 'size-[7px] rounded-full bg-[#b4233b]' : 'size-[7px] rounded-full bg-[#16834f]'
                  }
                />
                {formatSessionStatus(session.status)}
              </div>
              {hasFailed && session.lastError ? (
                <p className="mt-1 max-w-[70ch] whitespace-normal font-sans text-xs leading-5 text-[#7f1d1d]/80">
                  {session.lastError} {failureRecoveryMessage}
                </p>
              ) : null}
              {reviewRequestError ? <div className="mt-1 truncate text-[#b4233b]">{reviewRequestError}</div> : null}
            </div>
            {session.reviewRequest?.url ? (
              <a
                className="inline-flex h-10 items-center justify-center rounded-[10px] bg-[#16834f] px-5 text-[13.5px] font-semibold text-[#f7faf8]"
                href={session.reviewRequest.url}
                rel="noreferrer"
                target="_blank"
              >
                Voir sur GitHub
              </a>
            ) : (
              <Button
                disabled={!canCreateReviewRequest || createReviewRequestMutation.isPending}
                onClick={handleOpenReviewDialog}
              >
                Soumettre la PR
              </Button>
            )}
          </div>
        </section>
      </div>
      {isReviewDialogOpen ? (
        <ReviewRequestDialog
          error={reviewRequestError}
          isSubmitting={createReviewRequestMutation.isPending}
          onClose={handleCloseReviewDialog}
          onSubmit={handleCreateReviewRequest}
        />
      ) : null}
    </div>
  );
}

function formatSessionStatus(status: string): string {
  const labels: Record<string, string> = {
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

  return labels[status] ?? status;
}

function getPromptBlockedReason(status: string, isOnline: boolean): string | null {
  if (!isOnline) {
    return 'L’agent local est hors ligne. Le développeur doit le redémarrer avant le prochain message.';
  }

  const reasons: Record<string, string> = {
    CREATED: 'La session se prépare avant le premier message.',
    AGENT_CONNECTING: 'Connexion à l’agent en cours.',
    WORKTREE_CREATING: 'Création de l’espace de travail en cours.',
    DOCKER_STARTING: 'Démarrage de la preview en cours.',
    PREVIEW_STARTING: 'La preview démarre avant le premier message.',
    AGENT_RUNNING: 'L’agent traite ton message. Tu peux préparer la suite, puis l’envoyer dès qu’il a terminé.',
    CHECKS_RUNNING: 'L’agent vérifie les modifications. Tu pourras envoyer la suite dès la fin des contrôles.',
    REVIEW_REQUEST_CREATING: 'La pull request est en cours de création.',
    REVIEW_REQUEST_CREATED: 'La pull request a été créée pour cette session.',
    CLOSING: 'Cette session est en cours de fermeture.',
    CLOSED: 'Cette session est terminée.',
  };

  return reasons[status] ?? null;
}
