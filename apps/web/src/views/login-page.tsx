import { DeveloperLoginCard } from '../components/auth/developer-login-card.js';
import { PmLoginCard } from '../components/auth/pm-login-card.js';
import type { AuthSession } from '../schemas/auth.js';

interface LoginPageProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  void onAuthenticated;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-4 flex flex-col items-center gap-3 text-center">
        <PairDockMark />
        <div>
          <h1 className="font-['Space_Grotesk'] text-[24px] font-semibold leading-tight text-[#eef0f4] sm:text-[27px]">
            PairDock
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-[#6f7686]">
            Developer PM workspace
          </p>
        </div>
      </div>
      <p className="mb-7 max-w-[460px] text-center text-[14.5px] leading-6 text-[#8b92a1] sm:mb-9">
        Prête l'agent IA d'un développeur à ton équipe produit. Un volet pour prompter, un volet pour voir le rendu en
        direct.
      </p>
      <div className="grid w-full max-w-[760px] gap-[18px] md:grid-cols-2">
        <DeveloperLoginCard />
        <PmLoginCard />
      </div>
      <p className="mt-8 font-mono text-xs text-[#565d6b]">SSO · worktrees isolés · une PR par correctif</p>
    </div>
  );
}

function PairDockMark() {
  return (
    <span className="flex size-12 items-center justify-center rounded-[14px] bg-[#5fdf9b] text-[#0c2014] shadow-[0_18px_45px_rgba(95,223,155,0.16)]">
      <svg aria-hidden="true" className="size-8" fill="none" viewBox="0 0 24 24">
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
