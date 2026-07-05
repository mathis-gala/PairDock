import { authApi } from '../../api/client.js';
import type { AuthSession } from '../../schemas/auth.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';

interface PmLoginCardProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function PmLoginCard({ onAuthenticated: _onAuthenticated }: PmLoginCardProps) {
  void _onAuthenticated;

  function handleSlackAppAuth() {
    window.location.assign(authApi.pmStartUrl());
  }

  return (
    <SectionCard
      className="border-[#d3a4ea]/25 bg-gradient-to-b from-[#d3a4ea]/5 to-[#d3a4ea]/[0.015]"
      eyebrow="PM"
      title="Espace produit"
      description="Connecte ton workspace Slack pour rejoindre les projets partagés avec ton adresse d'équipe."
    >
      <div className="space-y-4">
        <Button
          className="w-full bg-[#d3a4ea] text-[#2a1635] hover:bg-[#ddb4f0]"
          onClick={handleSlackAppAuth}
          type="button"
        >
          Continuer avec Slack App
        </Button>
        <p className="flex items-center gap-2 font-mono text-[11.5px] text-[#6f7686]">
          <span className="size-1.5 rounded-full bg-[#d3a4ea]" />
          auth PM seulement · aucune notification bot
        </p>
      </div>
    </SectionCard>
  );
}
