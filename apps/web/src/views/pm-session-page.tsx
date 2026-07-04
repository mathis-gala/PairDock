import { useState } from 'react';
import { Button } from '../components/button.js';
import { DiffPanel } from '../components/pm-session/diff-panel.js';
import { PreviewFrame } from '../components/pm-session/preview-frame.js';
import { PreviewToolbar } from '../components/pm-session/preview-toolbar.js';
import { PromptComposer } from '../components/pm-session/prompt-composer.js';
import { PromptHistoryPanel } from '../components/pm-session/prompt-history-panel.js';
import { SessionEventPanel } from '../components/pm-session/session-event-panel.js';
import { SessionStatusCard } from '../components/pm-session/session-status-card.js';
import { ValidationPanel } from '../components/pm-session/validation-panel.js';
import { SectionCard } from '../components/section-card.js';
import { useSessionData } from '../hooks/use-session-data.js';
import { useSessionEventFeed } from '../hooks/use-session-event-feed.js';
import type { PreviewPresetId } from '../lib/preview-presets.js';

interface PmSessionPageProps {
  accessToken: string;
  onBack: () => void;
  sessionId: string;
}

export function PmSessionPage({ accessToken, onBack, sessionId }: PmSessionPageProps) {
  const [presetId, setPresetId] = useState<PreviewPresetId>('desktop');
  const [zoomPercent, setZoomPercent] = useState(100);
  const eventFeed = useSessionEventFeed(accessToken, sessionId);
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
      <div className="mx-auto max-w-7xl px-6 py-8">
        <SectionCard
          title="Loading PM session"
          description="Rehydrating the session, prompt history, events, diff, validation, and preview state."
        />
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-sky-300">PM session route</p>
          <h2 className="text-3xl font-semibold text-white">Session workspace</h2>
        </div>
        <Button onClick={onBack} variant="secondary">
          Back to shared projects
        </Button>
      </div>
      <SessionStatusCard
        feed={eventFeed}
        isCreatingReviewRequest={createReviewRequestMutation.isPending}
        onCreateReviewRequest={async () => {
          createReviewRequestMutation.reset();
          await createReviewRequestMutation.mutateAsync();
        }}
        reviewRequestError={
          createReviewRequestMutation.error instanceof Error ? createReviewRequestMutation.error.message : null
        }
        session={session}
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <PromptComposer
            canCancel={canCancel}
            isCancelling={cancelPromptMutation.isPending}
            isSubmitting={sendPromptMutation.isPending}
            onCancel={async () => {
              await cancelPromptMutation.mutateAsync();
            }}
            onSubmit={async (content) => {
              await sendPromptMutation.mutateAsync(content);
            }}
          />
          <PromptHistoryPanel messages={messagesQuery.data ?? []} />
          <SessionEventPanel events={eventsQuery.data ?? []} feed={eventFeed} />
        </div>
        <div className="space-y-6">
          <DiffPanel latestDiff={session.latestDiff} />
          <ValidationPanel validation={session.latestValidation} />
        </div>
      </div>
      <PreviewToolbar
        onPresetChange={setPresetId}
        onZoomChange={setZoomPercent}
        presetId={presetId}
        previewUrl={session.previewUrl}
        zoomPercent={zoomPercent}
      />
      <PreviewFrame presetId={presetId} previewUrl={session.previewUrl} zoomPercent={zoomPercent} />
    </div>
  );
}
