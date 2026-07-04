import { SectionCard } from '../components/section-card.js';
import type { AuthSession } from '../schemas/auth.js';

interface DeveloperHomePageProps {
  session: AuthSession;
}

export function DeveloperHomePage({ session }: DeveloperHomePageProps) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <SectionCard
        eyebrow="Developer access"
        title="Developer sign-in is wired"
        description="Task 12 focuses on the PM session flow. Developer authentication is available here so the two-column local login screen works, while the full developer dashboard remains in the next task."
      >
        <dl className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Provider</dt>
            <dd>{session.provider}</dd>
          </div>
          <div>
            <dt className="text-slate-500">User id</dt>
            <dd className="break-all">{session.user.id}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Current scope</dt>
            <dd>Task 12 PM login and PM session UI are ready to exercise locally.</dd>
          </div>
        </dl>
      </SectionCard>
    </div>
  );
}
