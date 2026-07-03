import type { PropsWithChildren, ReactNode } from 'react';
import { classNames } from '../lib/class-names.js';

interface SectionCardProps extends PropsWithChildren {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function SectionCard({ actions, children, className, description, eyebrow, title }: SectionCardProps) {
  return (
    <section
      className={classNames(
        'rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">{eyebrow}</p> : null}
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description ? <div className="text-sm text-slate-400">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
