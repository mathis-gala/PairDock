import { authApi } from '../../api/client.js';
import { GitHubIcon } from '../brand-icons.js';
import { Button } from '../button.js';

export function DeveloperLoginCard() {
  function handleGithubAppAuth() {
    window.location.assign(authApi.developerStartUrl());
  }

  return (
    <section className="flex min-h-[250px] flex-col rounded-[14px] border border-[#5fdf9b]/25 bg-gradient-to-b from-[#5fdf9b]/5 to-[#5fdf9b]/[0.015] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="mb-5 flex size-[42px] items-center justify-center rounded-[11px] border border-[#5fdf9b]/25 bg-[#5fdf9b]/10 text-[#5fdf9b]">
        <svg aria-hidden="true" className="size-[23px]" fill="none" viewBox="0 0 24 24">
          <circle cx="6.5" cy="6" r="2.3" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="6.5" cy="18" r="2.3" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17.5" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M6.5 8.3v7.4M6.5 11.5c0 2.5 11 2 11 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      </div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#6f7686]">Developer</p>
      <h2 className="mt-1 font-['Space_Grotesk'] text-[18px] font-semibold text-[#eef0f4]">Espace développeur</h2>
      <p className="mt-2 text-sm leading-6 text-[#8b92a1]">
        Installe l'app GitHub, choisis les dépôts autorisés et PairDock configure l'accès source-control
        automatiquement.
      </p>
      <div className="mt-auto pt-6">
        <Button className="w-full" onClick={handleGithubAppAuth} type="button">
          <GitHubIcon />
          Continuer avec GitHub App
        </Button>
        <p className="mt-4 flex items-center gap-2 font-mono text-[11.5px] text-[#6f7686]">
          <span className="size-1.5 rounded-full bg-[#5fdf9b]" />
          installation dépôt · PR draft via GitHub App
        </p>
      </div>
    </section>
  );
}
