import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { classNames } from '../lib/class-names.js';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:bg-slate-700 disabled:text-slate-400',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-500',
  ghost: 'bg-transparent text-slate-200 hover:bg-slate-800 disabled:text-slate-500',
  danger: 'bg-rose-500 text-white hover:bg-rose-400 disabled:bg-slate-700 disabled:text-slate-400',
};

export function Button({ children, className, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={classNames(
        'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      type={type}
    >
      {children}
    </button>
  );
}
