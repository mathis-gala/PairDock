import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { SectionCard } from '../section-card.js';
import { StatusBadge } from '../status-badge.js';

interface ConnectionActivityRailProps {
  projects: DeveloperProjectSummary[];
}

export function ConnectionActivityRail({ projects }: ConnectionActivityRailProps) {
  const sessions = projects.flatMap((project) =>
    project.sessions.map((session) => ({
      ...session,
      projectName: project.name,
    })),
  );
  const onlineCount = projects.filter((project) => project.agentAvailability === 'online').length;
  const pmMemberCount = projects.reduce((sum, project) => sum + project.pmMemberCount, 0);

  return (
    <aside className="space-y-4">
      <SectionCard eyebrow="Connections" title="Provider and local-agent state">
        <div className="space-y-3 text-sm text-slate-300">
          <RailMetric label="GitHub connections" value={`${projects.length}`} />
          <RailMetric label="Online agents" value={`${onlineCount}/${projects.length}`} />
          <RailMetric label="Shared PM grants" value={`${pmMemberCount}`} />
          <div className="flex flex-wrap gap-2">
            {projects.map((project) => (
              <StatusBadge key={project.id} tone={project.agentAvailability === 'online' ? 'positive' : 'warning'}>
                {project.name}: {project.agentAvailability}
              </StatusBadge>
            ))}
          </div>
        </div>
      </SectionCard>
      <SectionCard eyebrow="Activity" title="Recent session activity">
        {sessions.length > 0 ? (
          <ol className="space-y-3 text-sm text-slate-300">
            {sessions.slice(0, 6).map((session) => (
              <li className="rounded-xl border border-slate-800 bg-slate-950/70 p-3" key={session.id}>
                <p className="font-medium text-white">{session.projectName}</p>
                <p className="text-xs text-slate-500">
                  {session.status} · {session.modelId}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-500">No developer sessions started yet.</p>
        )}
      </SectionCard>
    </aside>
  );
}

interface RailMetricProps {
  label: string;
  value: string;
}

function RailMetric({ label, value }: RailMetricProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
