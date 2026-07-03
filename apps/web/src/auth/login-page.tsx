import type { AuthSession } from './auth-types.js';
import { DeveloperLoginCard } from './developer-login-card.js';
import { PmLoginCard } from './pm-login-card.js';

interface LoginPageProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-10">
      <div className="mb-10 max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">PairDock local MVP</p>
        <h1 className="text-4xl font-semibold text-white">One login screen, two local collaboration paths.</h1>
        <p className="text-lg text-slate-400">
          Sign in as a developer to verify the shared entry point, or sign in as a PM to open the shared-project
          dashboard and launch a PM session.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <DeveloperLoginCard onAuthenticated={onAuthenticated} />
        <PmLoginCard onAuthenticated={onAuthenticated} />
      </div>
    </div>
  );
}
