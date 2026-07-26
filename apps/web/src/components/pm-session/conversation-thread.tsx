import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { createApiClient } from '../../api/client.js';
import { classNames } from '../../lib/class-names.js';
import type { SessionConversationItem } from '../../lib/session-conversation.js';
import { sessionQueryKeys } from '../../lib/session-query-keys.js';
import { ImageLightbox } from '../image-lightbox.js';

interface ConversationThreadProps {
  accessToken?: string;
  isTyping: boolean;
  items: SessionConversationItem[];
  sessionId?: string;
}

export function ConversationThread({ accessToken, isTyping, items, sessionId }: ConversationThreadProps) {
  const [expandedImage, setExpandedImage] = useState<{ alt: string; src: string } | null>(null);

  function handleCloseLightbox() {
    setExpandedImage(null);
  }

  if (items.length === 0 && !isTyping) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 py-12 text-center">
        <div className="max-w-[320px]">
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-xl bg-[#5fdf9b]/10 text-[#5fdf9b]">
            ✦
          </div>
          <h2 className="text-sm font-semibold text-[#eef0f4]">Que veux-tu modifier ?</h2>
          <p className="mt-2 text-xs leading-5 text-[#7d8493]">
            Décris une feature ou un bug. L’agent répond ici pendant que la preview se met à jour.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ol aria-label="Conversation" className="flex min-h-full min-w-0 flex-col justify-end gap-3 px-4 py-5">
        {items.map((item) => (
          <li
            className={classNames('flex min-w-0', item.role === 'user' ? 'justify-end' : 'justify-start')}
            key={item.id}
          >
            <div
              className={classNames(
                'min-w-0 max-w-[86%] space-y-2.5 whitespace-pre-wrap [overflow-wrap:anywhere] rounded-2xl text-[13.5px] leading-5',
                item.role === 'user'
                  ? 'rounded-br-md bg-[#5fdf9b] px-3.5 py-2.5 text-[#0c2014] shadow-sm'
                  : item.kind === 'progress'
                    ? 'rounded-bl-md border border-white/8 bg-[#1b1e25] px-3 py-2 text-[#a3aab8]'
                    : item.tone === 'error'
                      ? 'rounded-bl-md border border-rose-400/25 bg-rose-400/10 px-3.5 py-2.5 text-rose-100 shadow-sm'
                      : 'rounded-bl-md border border-white/10 bg-[#242832] px-3.5 py-2.5 text-[#e5e8ee] shadow-sm',
              )}
            >
              {item.kind === 'progress' ? (
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <span aria-hidden="true" className="mt-[7px] size-1.5 rounded-full bg-[#5fdf9b]" />
                  <div>
                    <div className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#6f7686]">
                      Progression
                    </div>
                    {item.text}
                  </div>
                </div>
              ) : item.text ? (
                <div>{item.text}</div>
              ) : null}
              {item.attachments?.length && accessToken && sessionId ? (
                <div className={classNames('grid gap-2', item.attachments.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>
                  {item.attachments.map((attachment) => (
                    <ConversationScreenshot
                      accessToken={accessToken}
                      attachment={attachment}
                      key={attachment.id}
                      onOpen={setExpandedImage}
                      sessionId={sessionId}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
        {isTyping ? <TypingIndicator /> : null}
      </ol>
      {expandedImage ? (
        <ImageLightbox alt={expandedImage.alt} onClose={handleCloseLightbox} src={expandedImage.src} />
      ) : null}
    </>
  );
}

function ConversationScreenshot({
  accessToken,
  attachment,
  onOpen,
  sessionId,
}: {
  accessToken: string;
  attachment: NonNullable<SessionConversationItem['attachments']>[number];
  onOpen: (image: { alt: string; src: string }) => void;
  sessionId: string;
}) {
  const imageQuery = useQuery({
    queryKey: sessionQueryKeys.attachment(accessToken, sessionId, attachment.id),
    queryFn: () => createApiClient(accessToken).sessions.readAttachment(sessionId, attachment.id),
    staleTime: Number.POSITIVE_INFINITY,
  });

  function handleOpen() {
    if (imageQuery.data) {
      onOpen({ alt: attachment.fileName, src: imageQuery.data });
    }
  }

  if (imageQuery.isError) {
    return (
      <div className="flex min-h-20 items-center justify-center rounded-[9px] border border-white/10 bg-[#15181e]/70 px-3 text-center text-xs text-rose-200">
        Capture indisponible
      </div>
    );
  }

  return (
    <button
      aria-label={`Agrandir ${attachment.fileName}`}
      className="group relative min-h-20 cursor-zoom-in overflow-hidden rounded-[9px] border border-black/15 bg-[#15181e]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/60"
      disabled={!imageQuery.data}
      onClick={handleOpen}
      type="button"
    >
      {imageQuery.data ? (
        <img
          alt={attachment.fileName}
          className="max-h-52 w-full object-cover transition duration-200 ease-out group-hover:scale-[1.02]"
          loading="lazy"
          src={imageQuery.data}
        />
      ) : (
        <span className="absolute inset-0 animate-pulse bg-white/5 motion-reduce:animate-none" />
      )}
    </button>
  );
}

function TypingIndicator() {
  return (
    <li className="flex min-w-0 justify-start" role="status">
      <span className="sr-only">L’agent rédige une réponse.</span>
      <span
        aria-hidden="true"
        className="flex h-10 items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-[#242832] px-3.5 shadow-sm"
      >
        <span className="pd-typing-dot size-1.5 rounded-full bg-[#a3aab8]" />
        <span className="pd-typing-dot size-1.5 rounded-full bg-[#a3aab8]" />
        <span className="pd-typing-dot size-1.5 rounded-full bg-[#a3aab8]" />
      </span>
    </li>
  );
}
