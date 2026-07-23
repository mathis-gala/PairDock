import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { classNames } from '../lib/class-names.js';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[#16834f] text-[#f7faf8] hover:bg-[#299b66] disabled:bg-[#e4e8ed] disabled:text-[#697386]',
  secondary:
    'border-black/10 bg-[#e4e8ed] text-[#20242b] hover:border-black/20 hover:bg-[#dce2e8] disabled:bg-[#eef1f4] disabled:text-[#7a8494]',
  ghost: 'border-transparent bg-transparent text-[#46505f] hover:bg-black/5 disabled:text-[#7a8494]',
  danger:
    'border-transparent bg-[#b4233b] text-[#fff8f8] hover:bg-[#9f1d32] disabled:bg-[#e4e8ed] disabled:text-[#697386]',
};

export function Button({ children, className, type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={classNames(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] border px-4 py-2 text-[13.5px] font-semibold transition disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      type={type}
    >
      {children}
    </button>
  );
}
