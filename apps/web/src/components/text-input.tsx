import type { InputHTMLAttributes } from 'react';
import { classNames } from '../lib/class-names.js';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400',
        props.className,
      )}
    />
  );
}
