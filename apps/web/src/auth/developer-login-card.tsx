import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Button } from '../ui/button.js';
import { SectionCard } from '../ui/section-card.js';
import { TextInput } from '../ui/text-input.js';
import { authenticateDeveloper, createBrowserSeed } from './auth-api.js';
import type { AuthSession } from './auth-types.js';

interface DeveloperLoginCardProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function DeveloperLoginCard({ onAuthenticated }: DeveloperLoginCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      seed: createBrowserSeed('developer'),
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      setIsSubmitting(true);

      try {
        const session = await authenticateDeveloper(value.seed);
        onAuthenticated(session);
      } finally {
        setIsSubmitting(false);
      }
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
            Task 12 includes the login surface. The developer dashboard lands in the next task.
          </p>
          <Button type="submit">{isSubmitting ? 'Signing in…' : 'Sign in as developer'}</Button>
        </div>
      </form>
    </SectionCard>
  );
}
