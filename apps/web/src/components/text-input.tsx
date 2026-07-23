import type { InputHTMLAttributes } from 'react';
import { classNames } from '../lib/class-names.js';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        'min-h-10 w-full rounded-[9px] border border-black/10 bg-[#ffffff] px-3 py-2 text-[13px] text-[#20242b] outline-none transition placeholder:text-[#7a8494] focus:border-[#16834f]',
        props.className,
      )}
    />
  );
}
