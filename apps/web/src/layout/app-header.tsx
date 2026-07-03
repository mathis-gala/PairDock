import type { AuthSession } from '../auth/auth-types.js';
import { Button } from '../ui/button.js';

interface AppHeaderProps {
  currentViewLabel: string;
  onSignOut: () => void;
  user: AuthSession['user'];
}

export function AppHeader({ currentViewLabel, onSignOut, user }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">PairDock MVP</p>
          <h1 className="text-xl font-semibold text-white">{currentViewLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
            <span className="font-medium text-white">{user.displayName ?? user.email}</span>
            <span className="ml-2 text-slate-400">{user.kind}</span>
          </div>
          <Button onClick={onSignOut} variant="secondary">
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
