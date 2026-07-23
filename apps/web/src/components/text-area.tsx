import type { TextareaHTMLAttributes } from 'react';
import { classNames } from '../lib/class-names.js';

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        'min-h-28 w-full resize-y rounded-[10px] border border-black/10 bg-[#ffffff] px-3 py-2 text-[13.5px] leading-6 text-[#20242b] outline-none transition placeholder:text-[#7a8494] focus:border-[#16834f]',
        props.className,
      )}
    />
  );
}
