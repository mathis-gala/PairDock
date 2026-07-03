import { useForm } from '@tanstack/react-form';
import { useState } from 'react';
import { Button } from '../ui/button.js';
import { SectionCard } from '../ui/section-card.js';
import { TextInput } from '../ui/text-input.js';
import { authenticatePm, createBrowserSeed } from './auth-api.js';
import type { AuthSession } from './auth-types.js';

interface PmLoginCardProps {
  onAuthenticated: (session: AuthSession) => void;
}

export function PmLoginCard({ onAuthenticated }: PmLoginCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      seed: createBrowserSeed('pm'),
      teamId: 'pairdock-local-team',
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null);
      setIsSubmitting(true);

      try {
        const session = await authenticatePm(value.seed, value.teamId);
        onAuthenticated(session);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <SectionCard
      eyebrow="PM"
      title="Slack-backed PM sign-in"
      description="This path unlocks the PM shared-project dashboard, PM session route, prompting, live events, diff history, validation state, and responsive preview."
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
              <div className="space-y-2 text-sm text-slate-300">
                <label className="block" htmlFor={inputId}>
                  PM seed
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
              <div className="space-y-2 text-sm text-slate-300">
                <label className="block" htmlFor={inputId}>
                  Slack team id
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
          <p className="text-sm text-slate-500">Only projects already shared with this PM appear on the dashboard.</p>
          <Button type="submit">{isSubmitting ? 'Signing in…' : 'Sign in as PM'}</Button>
        </div>
      </form>
    </SectionCard>
  );
}
