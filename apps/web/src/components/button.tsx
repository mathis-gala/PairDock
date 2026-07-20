import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { classNames } from '../lib/class-names.js';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[#5fdf9b] text-[#0c2014] hover:bg-[#74e6ab] disabled:bg-[#23272f] disabled:text-[#6f7686]',
  secondary:
    'border-white/10 bg-[#23272f] text-[#eef0f4] hover:border-white/20 hover:bg-[#2a2f38] disabled:bg-[#1a1d24] disabled:text-[#565d6b]',
  ghost: 'border-transparent bg-transparent text-[#cdd2dc] hover:bg-white/5 disabled:text-[#565d6b]',
  danger: 'border-transparent bg-rose-500 text-white hover:bg-rose-400 disabled:bg-[#23272f] disabled:text-[#6f7686]',
};

export function Button({ children, className, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={classNames(
        'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-[13.5px] font-semibold transition disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      type={type}
    >
      {children}
    </button>
  );
}
