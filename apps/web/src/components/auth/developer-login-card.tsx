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
      eyebrow="Developer"
      title="GitHub-backed developer sign-in"
      description="Use a local token seed to normalize a developer identity through the backend GitHub callback flow."
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
              <div className="space-y-2 text-sm text-slate-300">
                <label className="block" htmlFor={inputId}>
                  Developer seed
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Opens project creation, PM sharing, model selection, session start, and cleanup controls.
          </p>
          <Button type="submit">{isSubmitting ? 'Signing in…' : 'Sign in as developer'}</Button>
        </div>
      </form>
    </SectionCard>
  );
}
