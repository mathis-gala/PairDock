import type { SelectHTMLAttributes } from 'react';
import { classNames } from '../lib/class-names.js';

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        'min-h-11 w-full cursor-pointer rounded-[9px] border border-black/10 bg-[#ffffff] px-3 py-2 text-[13px] text-[#20242b] outline-none transition focus:border-[#16834f] focus-visible:ring-2 focus-visible:ring-[#16834f]/30 disabled:cursor-not-allowed disabled:opacity-50',
        props.className,
      )}
    />
  );
}
