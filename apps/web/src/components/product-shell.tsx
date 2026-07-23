import type { ReactNode } from 'react';
import type { AuthSession } from '../schemas/auth.js';
import { Button } from './button.js';

interface ProductShellProps {
  accent?: 'developer' | 'pm';
  children: ReactNode;
  onSignOut: () => void;
  navItems: Array<{ active: boolean; href: string; label: string }>;
  user: AuthSession['user'];
  viewLabel: string;
}

export function ProductShell({
  accent = 'developer',
  children,
  navItems,
  onSignOut,
  user,
  viewLabel,
}: ProductShellProps) {
  const color = accent === 'pm' ? '#8b5fb0' : '#16834f';
  const activeBg = accent === 'pm' ? 'bg-[#8b5fb0]/10 text-[#5b2d72]' : 'bg-[#16834f]/10 text-[#14532d]';
  const initial = (user.displayName ?? user.email).slice(0, 1).toUpperCase();

  return (
    <div className="min-h-dvh bg-[#f7f8fa] md:flex">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-black/10 bg-[#ffffff]/95 px-4 backdrop-blur md:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <PairDockMark color={color} size="mobile" />
          <div className="min-w-0">
            <div className="font-['Space_Grotesk'] text-[15px] font-semibold">PairDock</div>
            <div className="truncate text-[11px] text-[#697386]">{viewLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex size-8 items-center justify-center rounded-[9px] text-[13px] font-semibold"
            style={{
              backgroundColor: accent === 'pm' ? '#eadcf2' : '#d8f0df',
              color: accent === 'pm' ? '#5b2d72' : '#14532d',
            }}
          >
            {initial}
          </div>
          <Button className="min-h-9 px-3" onClick={onSignOut} variant="ghost">
            Quitter
          </Button>
        </div>
      </header>
      <nav
        aria-label="Navigation principale"
        className="flex gap-1 overflow-x-auto border-b border-black/10 bg-[#ffffff] px-3 py-2 md:hidden"
      >
        {navItems.map((item) => (
          <a
            aria-current={item.active ? 'page' : undefined}
            className={`min-h-10 whitespace-nowrap rounded-[9px] px-3 py-2 text-[13px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 ${
              item.active ? activeBg : 'text-[#5e6878] hover:bg-black/5 hover:text-[#20242b]'
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <aside className="sticky top-0 hidden h-dvh w-[228px] flex-none flex-col self-start overflow-y-auto border-r border-black/10 bg-[#ffffff] p-[18px_14px] md:flex">
        <div className="flex items-center gap-2 px-1 pb-5">
          <PairDockMark color={color} />
          <span className="font-['Space_Grotesk'] text-base font-semibold">PairDock</span>
        </div>
        <nav aria-label="Navigation principale" className="space-y-1">
          {navItems.map((item) => (
            <a
              aria-current={item.active ? 'page' : undefined}
              className={`block min-h-10 rounded-[9px] px-3 py-2 text-[13.5px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 ${
                item.active ? activeBg : 'text-[#5e6878] hover:bg-black/5 hover:text-[#20242b]'
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-black/10 pt-3">
          <div className="mb-3 flex items-center gap-2.5">
            <div
              className="flex size-8 items-center justify-center rounded-[9px] text-[13px] font-semibold"
              style={{
                backgroundColor: accent === 'pm' ? '#eadcf2' : '#d8f0df',
                color: accent === 'pm' ? '#5b2d72' : '#14532d',
              }}
            >
              {initial}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium">{user.displayName ?? user.email}</div>
              <div className="text-[11px] text-[#697386]">{user.kind === 'pm' ? 'Product Manager' : 'Développeur'}</div>
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

function PairDockMark({ color, size = 'desktop' }: { color: string; size?: 'desktop' | 'mobile' }) {
  return (
    <span
      className={
        size === 'mobile'
          ? 'flex size-[24px] items-center justify-center rounded-[7px]'
          : 'flex size-[22px] items-center justify-center rounded-[6px]'
      }
      style={{ backgroundColor: color }}
    >
      <svg aria-hidden="true" className="size-4 text-[#073b22]" fill="none" viewBox="0 0 24 24">
        <path
          d="M9.2 8 6.4 12l2.8 4M14.8 8l2.8 4-2.8 4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}
