import type { SelectHTMLAttributes } from 'react';
import { classNames } from '../lib/class-names.js';

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        'min-h-11 w-full cursor-pointer rounded-[9px] border border-white/10 bg-[#1f232b] px-3 py-2 text-[13px] text-[#eef0f4] outline-none transition focus:border-[#5fdf9b] focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/30 disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  );
}
