import { useForm } from '@tanstack/react-form';
import { useAuthenticateDeveloper } from '../../hooks/use-authenticate.js';
import { createBrowserSeed } from '../../lib/browser-seed.js';
import type { AuthSession } from '../../schemas/auth.js';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { TextInput } from '../text-input.js';

interface DeveloperLoginCardProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function DeveloperLoginCard({ onAuthenticated }: DeveloperLoginCardProps) {
  const { isSubmitting, errorMessage, authenticate } = useAuthenticateDeveloper(onAuthenticated);
  const form = useForm({
    defaultValues: {
      seed: createBrowserSeed('developer'),
    },
    onSubmit: async ({ value }) => {
      await authenticate(value.seed);
    },
  });

  return (
    <SectionCard
      className="border-[#5fdf9b]/25 bg-gradient-to-b from-[#5fdf9b]/5 to-[#5fdf9b]/[0.015]"
      eyebrow="Developer"
      title="Espace développeur"
      description="Provisionne un projet à partir d'un dépôt, choisis un modèle et ouvre une session que ton PM pourra rejoindre."
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
            const inputId = 'developer-seed';

            return (
              <div className="space-y-2 text-sm text-[#cdd2dc]">
                <label className="block" htmlFor={inputId}>
                  Identité GitHub locale
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
          <Button className="w-full" type="submit">
            {isSubmitting ? 'Connexion…' : 'Continuer avec GitHub'}
          </Button>
          <p className="flex items-center gap-2 font-mono text-[11.5px] text-[#6f7686]">
            <span className="size-1.5 rounded-full bg-[#5fdf9b]" />
            gh CLI requis · accès dépôts
          </p>
        </div>
      </form>
    </SectionCard>
  );
}
