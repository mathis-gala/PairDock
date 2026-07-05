import { authApi } from '../../api/client.js';
import type { AuthSession } from '../../schemas/auth.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';

interface DeveloperLoginCardProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function DeveloperLoginCard({ onAuthenticated: _onAuthenticated }: DeveloperLoginCardProps) {
  void _onAuthenticated;

  function handleGithubAppAuth() {
    window.location.assign(authApi.developerStartUrl());
  }

  return (
    <SectionCard
      className="border-[#5fdf9b]/25 bg-gradient-to-b from-[#5fdf9b]/5 to-[#5fdf9b]/[0.015]"
      eyebrow="Developer"
      title="Espace développeur"
      description="Installe l'app GitHub, choisis les dépôts autorisés et PairDock configure l'accès source-control automatiquement."
    >
      <div className="space-y-4">
        <Button className="w-full" onClick={handleGithubAppAuth} type="button">
          Continuer avec GitHub App
        </Button>
        <p className="flex items-center gap-2 font-mono text-[11.5px] text-[#6f7686]">
          <span className="size-1.5 rounded-full bg-[#5fdf9b]" />
          installation dépôt · PR draft via GitHub App
        </p>
      </div>
    </SectionCard>
  );
}
