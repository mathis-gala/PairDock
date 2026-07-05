import { DeveloperLoginCard } from '../components/auth/developer-login-card.js';
import { PmLoginCard } from '../components/auth/pm-login-card.js';
import type { AuthSession } from '../schemas/auth.js';

interface LoginPageProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="mb-9 flex items-center gap-3">
        <PairDockMark />
        <span className="font-['Space_Grotesk'] text-[21px] font-semibold">PairDock</span>
      </div>
      <p className="-mt-7 mb-9 max-w-[430px] text-center text-[14.5px] leading-6 text-[#8b92a1]">
        Prête le Codex d'un développeur à ton équipe produit. Un volet pour prompter, un volet pour voir le rendu en
        direct.
      </p>
      <div className="grid w-full max-w-[720px] gap-[18px] md:grid-cols-2">
        <DeveloperLoginCard onAuthenticated={onAuthenticated} />
        <PmLoginCard onAuthenticated={onAuthenticated} />
      </div>
      <p className="mt-8 font-mono text-xs text-[#565d6b]">SSO · worktrees isolés · une PR par correctif</p>
    </div>
  );
}

function PairDockMark() {
  return (
    <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-[#5fdf9b] text-[#0c2014]">
      <svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 24 24">
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
