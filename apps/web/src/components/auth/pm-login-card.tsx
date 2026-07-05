import { useForm } from '@tanstack/react-form';
import { useAuthenticatePm } from '../../hooks/use-authenticate.js';
import { createBrowserSeed } from '../../lib/browser-seed.js';
import type { AuthSession } from '../../schemas/auth.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { TextInput } from '../text-input.js';

interface PmLoginCardProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function PmLoginCard({ onAuthenticated }: PmLoginCardProps) {
  const { isSubmitting, errorMessage, authenticate } = useAuthenticatePm(onAuthenticated);
  const form = useForm({
    defaultValues: {
      seed: createBrowserSeed('pm'),
      teamId: 'pairdock-local-team',
    },
    onSubmit: async ({ value }) => {
      await authenticate(value.seed, value.teamId);
    },
  });

  return (
    <SectionCard
      className="border-[#d3a4ea]/25 bg-gradient-to-b from-[#d3a4ea]/5 to-[#d3a4ea]/[0.015]"
      eyebrow="PM"
      title="Espace produit"
      description="Rejoins une session sur invitation, décris le correctif en langage naturel et ouvre la pull request."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="seed">
          {(field) => {
            const inputId = 'pm-seed';

            return (
              <div className="space-y-2 text-sm text-[#cdd2dc]">
                <label className="block" htmlFor={inputId}>
                  Identité Slack locale
                </label>
                <TextInput
                  id={inputId}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
              </div>
            );
          }}
        </form.Field>
        <form.Field name="teamId">
          {(field) => {
            const inputId = 'pm-team-id';

            return (
              <div className="space-y-2 text-sm text-[#cdd2dc]">
                <label className="block" htmlFor={inputId}>
                  Workspace Slack
                </label>
                <TextInput
                  id={inputId}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  value={field.state.value}
                />
              </div>
            );
          }}
        </form.Field>
        {errorMessage ? <p className="text-sm text-rose-300">{errorMessage}</p> : null}
        <div className="space-y-3">
          <Button className="w-full bg-[#d3a4ea] text-[#2a1635] hover:bg-[#ddb4f0]" type="submit">
            {isSubmitting ? 'Connexion…' : 'Continuer avec Slack'}
          </Button>
          <p className="flex items-center gap-2 font-mono text-[11.5px] text-[#6f7686]">
            <span className="size-1.5 rounded-full bg-[#d3a4ea]" />
            sur invitation d'un dev
          </p>
        </div>
      </form>
    </SectionCard>
  );
}
