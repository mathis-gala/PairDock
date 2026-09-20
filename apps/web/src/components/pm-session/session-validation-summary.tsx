import { useId, useState } from 'react';
import { describeSessionValidation } from '../../lib/session-validation.js';
import type { ValidationSummaryView } from '../../schemas/session.js';

interface SessionValidationSummaryProps {
  changedFiles: string[] | null;
  sessionStatus: string;
  validation: ValidationSummaryView | null;
}

const checkColors = {
  passed: 'text-[#a9efc9]',
  failed: 'text-rose-300',
  skipped: 'text-amber-200',
  unknown: 'text-[#a3aab8]',
};

export function SessionValidationSummary({ changedFiles, sessionStatus, validation }: SessionValidationSummaryProps) {
  const titleId = useId();
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const result = describeSessionValidation(validation, sessionStatus);
  const fileCount = changedFiles?.length ?? 0;
  let fileSummary = 'Liste des fichiers non reçue';
  if (changedFiles) fileSummary = `${fileCount} fichier${fileCount > 1 ? 's' : ''} modifié${fileCount > 1 ? 's' : ''}`;
  let compactSummary = result.summary;
  if (result.notice)
    compactSummary =
      sessionStatus === 'FAILED' ? 'Demande en échec, contrôles à revoir.' : 'Travail en cours : résultats précédents.';

  function handleToggleDetails() {
    setIsExpanded((current) => !current);
  }

  return (
    <section
      aria-labelledby={titleId}
      className="border-t border-white/10 bg-[#15171c] px-3 py-1 text-xs sm:px-5 sm:py-3"
    >
      <div className="hidden flex-wrap items-baseline justify-between gap-x-4 gap-y-1 sm:flex">
        <h2 className="text-sm font-semibold text-[#eef0f4]" id={titleId}>
          À vérifier avant la PR
        </h2>
        <p aria-live="polite" className="text-[#cdd2dc]" role="status">
          {result.summary}
        </p>
      </div>
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/50 sm:hidden"
        onClick={handleToggleDetails}
        type="button"
      >
        <span className="min-w-0">
          <span className="block font-semibold text-[#eef0f4]">Validation · {fileSummary}</span>
          <span aria-live="polite" className="mt-0.5 block text-[#cdd2dc]" role="status">
            {compactSummary}
          </span>
        </span>
        <span aria-hidden="true" className="text-[#a3aab8]">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      <div className={isExpanded ? 'block' : 'hidden sm:block'} id={contentId}>
        {result.notice ? (
          <p className="mt-2 leading-5 text-amber-200" role="status">
            {result.notice}
          </p>
        ) : null}
        <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-4">
          {result.checks.map((check) => (
            <div key={check.label}>
              <dt className="text-[#a3aab8]">{check.label}</dt>
              <dd className={`mt-1 font-medium ${checkColors[check.status]}`}>{check.detail}</dd>
            </div>
          ))}
        </dl>
        <details className="mt-3 border-t border-white/10 pt-1">
          <summary className="min-h-9 cursor-pointer py-2 text-[#cdd2dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/50">
            {fileSummary}
          </summary>
          {fileCount > 0 ? (
            <ul
              aria-label="Fichiers modifiés"
              className="max-h-28 space-y-1 overflow-auto pb-2 font-mono text-[#a3aab8]"
            >
              {changedFiles?.map((file) => (
                <li className="break-all" key={file}>
                  {file}
                </li>
              ))}
            </ul>
          ) : (
            <p className="pb-2 leading-5 text-[#a3aab8]">
              {changedFiles
                ? 'Le dernier diff ne contient aucun fichier modifié.'
                : 'La liste apparaîtra quand l’agent aura publié un diff.'}
            </p>
          )}
        </details>
        <p className="mt-1 leading-5 text-[#a3aab8]">
          Vérifie aussi le résultat dans l’aperçu. Les contrôles automatiques ne remplacent pas ta validation.
        </p>
      </div>
    </section>
  );
}
