import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/client.js';
import type { AuthSession } from '../../schemas/auth.js';
import { SlackIcon } from '../brand-icons.js';
import { Button } from '../button.js';

interface PmLoginCardProps {
  developmentAuthEnabled: boolean;
  onAuthenticated: (session: AuthSession) => void;
}

export function PmLoginCard({ developmentAuthEnabled, onAuthenticated }: PmLoginCardProps) {
  const developmentLoginMutation = useMutation({
    mutationFn: authApi.authenticateDevelopmentPm,
    onSuccess: onAuthenticated,
  });

  function handleSlackAppAuth() {
    window.location.assign(authApi.pmStartUrl());
  }

  function handleDevelopmentAuth() {
    developmentLoginMutation.mutate();
  }

  return (
    <section className="flex min-h-[250px] flex-col rounded-[14px] border border-[#8b5fb0]/25 bg-gradient-to-b from-[#8b5fb0]/5 to-[#8b5fb0]/[0.015] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <div className="mb-5 flex size-[42px] items-center justify-center rounded-[11px] border border-[#8b5fb0]/25 bg-[#8b5fb0]/10 text-[#8b5fb0]">
        <svg aria-hidden="true" className="size-[22px]" fill="none" viewBox="0 0 24 24">
          <path
            d="M9.5 4 8 20M16 4l-1.5 16M4.5 9H20M4 15h15.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      </div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-[#697386]">PM</p>
      <h2 className="mt-1 font-['Space_Grotesk'] text-[18px] font-semibold text-[#20242b]">Espace produit</h2>
      <p className="mt-2 text-sm leading-6 text-[#5e6878]">
        {developmentAuthEnabled
          ? 'Entre avec l’identité PM locale pour tester les projets partagés avec pm@pairdock.test.'
          : "Connecte ton workspace Slack pour rejoindre les projets partagés avec ton adresse d'équipe."}
      </p>
      <div className="mt-auto pt-6">
        {developmentAuthEnabled ? (
          <Button
            className="w-full bg-[#8b5fb0] text-[#fffaff] hover:bg-[#9d75c0]"
            disabled={developmentLoginMutation.isPending}
            onClick={handleDevelopmentAuth}
            type="button"
          >
            {developmentLoginMutation.isPending ? 'Connexion…' : 'Entrer comme PM local'}
          </Button>
        ) : (
          <Button
            className="w-full bg-[#8b5fb0] text-[#fffaff] hover:bg-[#9d75c0]"
            onClick={handleSlackAppAuth}
            type="button"
          >
            <SlackIcon />
            Continuer avec Slack App
          </Button>
        )}
        {developmentLoginMutation.isError ? (
          <p className="mt-3 text-xs text-[#b4233b]" role="alert">
            Connexion PM locale impossible. Vérifie que l’API utilise DEV_PM_AUTH_ENABLED=true.
          </p>
        ) : null}
        <p className="mt-4 flex items-center gap-2 font-mono text-[11.5px] text-[#697386]">
          <span className="size-1.5 rounded-full bg-[#8b5fb0]" />
          {developmentAuthEnabled
            ? 'local uniquement · Slack reste requis en production'
            : 'auth PM seulement · aucune notification bot'}
        </p>
      </div>
    </section>
  );
}
