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
