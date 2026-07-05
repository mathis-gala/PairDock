import type { TextareaHTMLAttributes } from 'react';
import { classNames } from '../lib/class-names.js';

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        'min-h-28 w-full resize-y rounded-[10px] border border-white/10 bg-[#1f232b] px-3 py-2 text-[13.5px] leading-6 text-[#eef0f4] outline-none transition placeholder:text-[#565d6b] focus:border-[#5fdf9b]',
        props.className,
      )}
    />
  );
}
