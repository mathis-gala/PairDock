import type { ReactNode } from 'react';
import { classNames } from '../lib/class-names.js';

interface StatusBadgeProps {
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
  children: ReactNode;
}

const toneClasses: Record<StatusBadgeProps['tone'], string> = {
  neutral: 'border-black/10 bg-black/5 text-[#46505f]',
  positive: 'border-[#16834f]/40 bg-[#16834f]/10 text-[#16834f]',
  warning: 'border-[#956d00]/40 bg-[#956d00]/10 text-[#956d00]',
  danger: 'border-rose-400/40 bg-rose-500/10 text-[#b4233b]',
};

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        'inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-medium',
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
