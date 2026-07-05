import type { ReactNode } from 'react';
import type { AuthSession } from '../schemas/auth.js';
import { Button } from './button.js';

interface ProductShellProps {
  accent?: 'developer' | 'pm';
  children: ReactNode;
  navItems: string[];
  onSignOut: () => void;
  user: AuthSession['user'];
}

export function ProductShell({ accent = 'developer', children, navItems, onSignOut, user }: ProductShellProps) {
  const color = accent === 'pm' ? '#d3a4ea' : '#5fdf9b';
  const activeBg = accent === 'pm' ? 'bg-[#d3a4ea]/10 text-[#f0e3fa]' : 'bg-[#5fdf9b]/10 text-[#dff7ea]';
  const initial = (user.displayName ?? user.email).slice(0, 1).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#14161b]">
      <aside className="hidden w-[228px] flex-none flex-col border-r border-white/10 bg-[#16181e] p-[18px_14px] md:flex">
        <div className="flex items-center gap-2 px-1 pb-5">
          <span
            className="flex size-[22px] items-center justify-center rounded-[6px]"
            style={{ backgroundColor: color }}
          >
            <svg aria-hidden="true" className="size-4 text-[#0c2014]" fill="none" viewBox="0 0 24 24">
              <path
                d="M9.2 8 6.4 12l2.8 4M14.8 8l2.8 4-2.8 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span className="font-['Space_Grotesk'] text-base font-semibold">PairDock</span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item, index) => (
            <span
              className={`rounded-[9px] px-3 py-2 text-[13.5px] ${index === 0 ? activeBg : 'text-[#8b92a1]'}`}
              key={item}
            >
              {item}
            </span>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-3">
          <div className="mb-3 flex items-center gap-2.5">
            <div
              className="flex size-8 items-center justify-center rounded-[9px] text-[13px] font-semibold"
              style={{
                backgroundColor: accent === 'pm' ? '#5a3d7a' : '#2f7a52',
                color: accent === 'pm' ? '#f0e3fa' : '#eafff3',
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">{user.displayName ?? user.email}</div>
              <div className="text-[11px] text-[#6f7686]">{user.kind === 'pm' ? 'Product Manager' : 'Développeur'}</div>
            </div>
          </div>
          <Button className="w-full" onClick={onSignOut} variant="ghost">
            Déconnexion
          </Button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
