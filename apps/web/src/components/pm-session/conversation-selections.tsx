import type { PreviewElementSelection } from '@pairdock/shared-contracts';

interface ConversationSelectionsProps {
  selections: PreviewElementSelection[];
}

export function ConversationSelections({ selections }: ConversationSelectionsProps) {
  return (
    <fieldset className="flex min-w-0 flex-wrap gap-2 whitespace-normal">
      <legend className="sr-only">Éléments sélectionnés</legend>
      {selections.map((selection, index) => (
        <details className="group min-w-0 max-w-full open:w-full" key={`${selection.url}:${selection.selector}`}>
          <summary
            className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg border border-[#143821]/20 bg-[#143821]/10 px-2.5 text-xs font-medium hover:bg-[#143821]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143821] [&::-webkit-details-marker]:hidden"
            title={selection.text || selection.selector}
          >
            <svg aria-hidden="true" className="size-3.5 flex-none" fill="none" viewBox="0 0 24 24">
              <path d="m5 3 14 9-7 1-3 7-4-17Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
            </svg>
            Sélection {index + 1}
            <svg aria-hidden="true" className="size-3 flex-none group-open:rotate-180" fill="none" viewBox="0 0 16 16">
              <path
                d="m4 6 4 4 4-4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </summary>
          <div className="mt-2 space-y-2 rounded-lg border border-[#143821]/15 bg-[#143821]/5 p-3 text-xs [overflow-wrap:anywhere]">
            <p className="whitespace-pre-wrap font-medium">{selection.text || `<${selection.tagName}>`}</p>
            <dl className="space-y-2">
              <div>
                <dt className="font-medium">Page</dt>
                <dd>{selection.url}</dd>
              </div>
              <div>
                <dt className="font-medium">Sélecteur</dt>
                <dd className="font-mono">{selection.selector}</dd>
              </div>
            </dl>
          </div>
        </details>
      ))}
    </fieldset>
  );
}
