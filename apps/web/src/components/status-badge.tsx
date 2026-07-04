import type { ReactNode } from 'react';
import { classNames } from '../lib/class-names.js';

interface StatusBadgeProps {
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
  children: ReactNode;
}

const toneClasses: Record<StatusBadgeProps['tone'], string> = {
  neutral: 'border-slate-700 bg-slate-800 text-slate-200',
  positive: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  danger: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
};

export function StatusBadge({ children, tone }: StatusBadgeProps) {
  return (
    <span className={classNames('inline-flex rounded-full border px-2.5 py-1 text-xs font-medium', toneClasses[tone])}>
      {children}
    </span>
  );
}
