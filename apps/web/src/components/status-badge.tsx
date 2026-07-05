import type { ReactNode } from 'react';
import { classNames } from '../lib/class-names.js';

interface StatusBadgeProps {
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
  children: ReactNode;
}

const toneClasses: Record<StatusBadgeProps['tone'], string> = {
  neutral: 'border-white/10 bg-white/5 text-[#cdd2dc]',
  positive: 'border-[#5fdf9b]/40 bg-[#5fdf9b]/10 text-[#5fdf9b]',
  warning: 'border-[#edc873]/40 bg-[#edc873]/10 text-[#edc873]',
  danger: 'border-rose-400/40 bg-rose-500/10 text-rose-300',
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
