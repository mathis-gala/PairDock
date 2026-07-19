import { classNames } from '../../lib/class-names.js';
import type { SessionConversationItem } from '../../lib/session-conversation.js';

interface ConversationThreadProps {
  items: SessionConversationItem[];
}

export function ConversationThread({ items }: ConversationThreadProps) {
  if (items.length === 0) {
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
    <ol aria-label="Conversation" className="flex min-h-full flex-col justify-end gap-3 px-4 py-5">
      {items.map((item) => (
        <li className={classNames('flex', item.role === 'user' ? 'justify-end' : 'justify-start')} key={item.id}>
          <div
            className={classNames(
              'max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-5 shadow-sm',
              item.role === 'user'
                ? 'rounded-br-md bg-[#5fdf9b] text-[#0c2014]'
                : item.tone === 'error'
                  ? 'rounded-bl-md border border-rose-400/25 bg-rose-400/10 text-rose-100'
                  : 'rounded-bl-md border border-white/10 bg-[#242832] text-[#e5e8ee]',
            )}
          >
            {item.text}
          </div>
        </li>
      ))}
    </ol>
  );
}
