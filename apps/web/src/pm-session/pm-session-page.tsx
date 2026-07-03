import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../ui/button.js';
import { SectionCard } from '../ui/section-card.js';
import { DiffPanel } from './diff-panel.js';
import { PreviewFrame } from './preview-frame.js';
import type { PreviewPresetId } from './preview-presets.js';
import { PreviewToolbar } from './preview-toolbar.js';
import { PromptComposer } from './prompt-composer.js';
import { PromptHistoryPanel } from './prompt-history-panel.js';
import {
  cancelSessionPrompt,
  fetchSession,
  fetchSessionEvents,
  fetchSessionMessages,
  sendSessionPrompt,
} from './session-api.js';
import { useSessionEventFeed } from './session-event-feed-store.js';
import { SessionEventPanel } from './session-event-panel.js';
import type { SessionMessageView } from './session-schemas.js';
import { SessionStatusCard } from './session-status-card.js';
import { ValidationPanel } from './validation-panel.js';

interface PmSessionPageProps {
  accessToken: string;
  onBack: () => void;
  sessionId: string;
}

export function PmSessionPage({ accessToken, onBack, sessionId }: PmSessionPageProps) {
  const [presetId, setPresetId] = useState<PreviewPresetId>('desktop');
  const [zoomPercent, setZoomPercent] = useState(100);
  const queryClient = useQueryClient();
  const eventFeed = useSessionEventFeed(accessToken, sessionId);
  const sessionQuery = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => fetchSession(accessToken, sessionId),
  });
  const messagesQuery = useQuery({
    queryKey: ['session-messages', sessionId],
    queryFn: () => fetchSessionMessages(accessToken, sessionId),
  });
  const eventsQuery = useQuery({
    queryKey: ['session-events', sessionId],
    queryFn: () => fetchSessionEvents(accessToken, sessionId),
  });
  const sendPromptMutation = useMutation({
    mutationFn: (content: string) => sendSessionPrompt(accessToken, sessionId, content),
    onSuccess: (message) => {
      queryClient.setQueryData<SessionMessageView[]>(['session-messages', sessionId], (currentMessages) =>
        currentMessages ? [...currentMessages, message] : [message],
      );
    },
  });
  const cancelPromptMutation = useMutation({
    mutationFn: () => cancelSessionPrompt(accessToken, sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      void queryClient.invalidateQueries({ queryKey: ['session-events', sessionId] });
    },
  });

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
      <SessionStatusCard feed={eventFeed} session={session} />
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
