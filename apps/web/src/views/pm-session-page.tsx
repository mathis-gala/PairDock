import { useState } from 'react';
import { Button } from '../components/button.js';
import { ConversationThread } from '../components/pm-session/conversation-thread.js';
import { PreviewFrame } from '../components/pm-session/preview-frame.js';
import { PreviewToolbar } from '../components/pm-session/preview-toolbar.js';
import { PromptComposer } from '../components/pm-session/prompt-composer.js';
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
  const canCancel = session.status === 'AGENT_RUNNING' || session.status === 'CHECKS_RUNNING';
  const branchLabel = session.branchName ?? session.project.defaultBranch;
  const participantAvatars = session.participants.slice(0, 2).map((participant) => ({
    initial: participant.displayName.slice(0, 1),
    userId: participant.userId,
  }));
  const isOnline = session.project.agentAvailability === 'online';
  const hasFailed = session.status === 'FAILED';
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

  async function handleCreateReviewRequest() {
    createReviewRequestMutation.reset();
    await createReviewRequestMutation.mutateAsync();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0f1115]">
      <header className="flex h-14 flex-none items-center gap-4 border-b border-white/10 bg-[#16181e] px-4">
        <button
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
          <span className="flex items-center gap-1.5 font-mono text-xs text-[#5fdf9b]">
            <span className="size-[7px] rounded-full bg-[#5fdf9b] [animation:pd-pulse_2s_infinite]" />
            {isOnline ? 'en ligne' : 'hors ligne'}
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex w-full flex-none flex-col border-r border-white/10 bg-[#15171c] lg:w-[42%] lg:max-w-[560px]">
          <div className="border-b border-white/10 px-5 py-4">
            <h1 className="font-['Space_Grotesk'] text-sm font-semibold">Discussion</h1>
            <p className="mt-1 text-xs leading-5 text-[#7d8493]">
              Une demande = une session isolée. Tu peux échanger avec l’agent jusqu’à validation.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <ConversationThread items={conversation} />
          </div>
          <div className="border-t border-white/10 p-4">
            <PromptComposer
              canCancel={canCancel}
              isCancelling={cancelPromptMutation.isPending}
              isSubmitting={sendPromptMutation.isPending}
              onCancel={handleCancelPrompt}
              onSubmit={handleSendPrompt}
            />
          </div>
        </section>

        <section className="hidden min-w-0 flex-1 flex-col bg-[#0f1115] lg:flex">
          <div className="flex h-[46px] flex-none items-center gap-3 border-b border-white/10 bg-[#1a1d24] px-3.5">
            <div className="flex gap-1.5">
              <span className="size-[11px] rounded-full bg-[#ec6a5e]" />
              <span className="size-[11px] rounded-full bg-[#f4bf4f]" />
              <span className="size-[11px] rounded-full bg-[#61c554]" />
            </div>
            <div className="flex h-7 max-w-[520px] flex-1 items-center gap-2 rounded-[8px] border border-white/10 bg-[#0f1115] px-3 font-mono text-[11.5px] text-[#8b92a1]">
              <span className="text-[#5fdf9b]">⌁</span>
              {session.previewUrl ?? 'preview non publiée'}
              <span className="ml-auto text-[#565d6b]">worktree</span>
            </div>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#7d8493]">
              <span className="size-1.5 rounded-full bg-[#5fdf9b]" />
              responsive
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <PreviewFrame presetId={presetId} previewUrl={session.previewUrl} />
          </div>
          <PreviewToolbar onPresetChange={setPresetId} presetId={presetId} previewUrl={session.previewUrl} />
          <div className="flex min-h-[62px] flex-none items-center justify-between gap-4 border-t border-white/10 bg-[#16181e] px-5 py-3">
            <div aria-live="polite" className="min-w-0 font-mono text-[12.5px]" role={hasFailed ? 'alert' : 'status'}>
              <div
                className={
                  hasFailed ? 'flex items-center gap-2 text-rose-300' : 'flex items-center gap-2 text-[#5fdf9b]'
                }
              >
                <span
                  className={hasFailed ? 'size-[7px] rounded-full bg-rose-300' : 'size-[7px] rounded-full bg-[#5fdf9b]'}
                />
                {formatSessionStatus(session.status)}
              </div>
              {hasFailed && session.lastError ? (
                <p className="mt-1 max-w-[70ch] whitespace-normal font-sans text-xs leading-5 text-rose-100/80">
                  {session.lastError} Tu peux envoyer un nouveau message pour réessayer.
                </p>
              ) : null}
              {reviewRequestError ? <div className="mt-1 truncate text-rose-300">{reviewRequestError}</div> : null}
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
            ) : (
              <Button
                disabled={!canCreateReviewRequest || createReviewRequestMutation.isPending}
                onClick={handleCreateReviewRequest}
              >
                {createReviewRequestMutation.isPending ? 'Ouverture…' : 'Soumettre la PR'}
              </Button>
            )}
          </div>
        </section>
      </div>
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
