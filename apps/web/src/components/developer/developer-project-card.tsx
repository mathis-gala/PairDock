import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { StatusBadge } from '../status-badge.js';
import { ProjectShareForm } from './project-share-form.js';
import { SessionControlCard } from './session-control-card.js';
import { ToolReadinessPanel } from './tool-readiness-panel.js';

interface DeveloperProjectCardProps {
  closePendingSessionId: string | null;
  onCloseSession: (sessionId: string) => Promise<void>;
  onRequestReadiness: (projectId: string) => Promise<void>;
  onShareProject: (projectId: string, pmEmail: string) => Promise<void>;
  onStartSession: (projectId: string, modelId: string) => Promise<void>;
  project: DeveloperProjectSummary;
  readinessPendingProjectId: string | null;
  sharePendingProjectId: string | null;
  startPendingProjectId: string | null;
}

export function DeveloperProjectCard({
  closePendingSessionId,
  onCloseSession,
  onRequestReadiness,
  onShareProject,
  onStartSession,
  project,
  readinessPendingProjectId,
  sharePendingProjectId,
  startPendingProjectId,
}: DeveloperProjectCardProps) {
  const startPending = startPendingProjectId === project.id;
  const readinessPending = readinessPendingProjectId === project.id;
  const startBlockedByReadiness = project.agentAvailability !== 'online' || project.readiness?.ok !== true;
  const sharePending = sharePendingProjectId === project.id;

  return (
    <SectionCard
      actions={
        <StatusBadge tone={project.agentAvailability === 'online' ? 'positive' : 'warning'}>
          {project.agentAvailability}
        </StatusBadge>
      }
      eyebrow="Developer project"
      title={project.name}
      description={project.description ?? 'No project description set.'}
    >
      <div className="grid gap-4 text-sm text-slate-300 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:grid-cols-2">
            <ProjectFact label="Repository" value={project.repoFullName} />
            <ProjectFact label="Branch" value={project.defaultBranch} />
            <ProjectFact label="Connection" value={project.sourceControlAccountLogin} />
            <ProjectFact
              label="PM access"
              value={`${project.pmMemberCount} PM${project.pmMemberCount === 1 ? '' : 's'}`}
            />
            <ProjectFact label="Agent key" value={project.agentProjectKey} />
            <ProjectFact label="Default model" value={project.defaultModelId} />
            <ProjectFact label="PM-start policy" value={project.pmCanStartSessions ? 'Enabled' : 'Disabled'} />
          </dl>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Developer session</p>
            <p className="mt-1 break-all text-sm text-slate-300">
              Uses the saved agent model: {project.defaultModelId}
            </p>
            <Button
              className="mt-3"
              disabled={startPending || startBlockedByReadiness}
              onClick={async () => onStartSession(project.id, project.defaultModelId)}
            >
              {startPending ? 'Starting session…' : 'Start developer session'}
            </Button>
          </div>
          <ToolReadinessPanel
            agentAvailability={project.agentAvailability}
            isRequesting={readinessPending}
            onRequestReadiness={async () => onRequestReadiness(project.id)}
            readiness={project.readiness}
          />
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Share with PM</p>
            <ProjectShareForm
              isSubmitting={sharePending}
              onShare={async (pmEmail) => onShareProject(project.id, pmEmail)}
            />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sessions and cleanup</p>
          {project.sessions.length > 0 ? (
            project.sessions.map((session) => (
              <SessionControlCard
                closePending={closePendingSessionId === session.id}
                key={session.id}
                onClose={onCloseSession}
                session={session}
              />
            ))
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
              No sessions yet. Start a developer session with the configured agent model.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

interface ProjectFactProps {
  label: string;
  value: string;
}

function ProjectFact({ label, value }: ProjectFactProps) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="break-all text-slate-200">{value}</dd>
    </div>
  );
}
