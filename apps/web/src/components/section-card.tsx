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
        'rounded-[14px] border border-black/10 bg-[#ffffff] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)]',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          {eyebrow ? (
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#697386]">{eyebrow}</p>
          ) : null}
          <h2 className="font-['Space_Grotesk'] text-[18px] font-semibold text-[#20242b]">{title}</h2>
          {description ? <div className="text-sm leading-6 text-[#5e6878]">{description}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
