import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { useState } from 'react';
import { Button } from '../button.js';
import { SectionCard } from '../section-card.js';
import { StatusBadge } from '../status-badge.js';
import { ProjectShareForm } from './project-share-form.js';
import { SessionControlCard } from './session-control-card.js';

const modelOptions = ['codex-cli/gpt-5.4', 'codex-cli/gpt-5.5', 'openai-compatible/gpt-4.1', 'custom/local'];

interface DeveloperProjectCardProps {
  closePendingSessionId: string | null;
  onCloseSession: (sessionId: string) => Promise<void>;
  onShareProject: (projectId: string, pmEmail: string) => Promise<void>;
  onStartSession: (projectId: string, modelId: string) => Promise<void>;
  project: DeveloperProjectSummary;
  sharePendingProjectId: string | null;
  startPendingProjectId: string | null;
}

export function DeveloperProjectCard({
  closePendingSessionId,
  onCloseSession,
  onShareProject,
  onStartSession,
  project,
  sharePendingProjectId,
  startPendingProjectId,
}: DeveloperProjectCardProps) {
  const [selectedModelId, setSelectedModelId] = useState(project.defaultModelId);
  const startPending = startPendingProjectId === project.id;
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
            <ProjectFact label="PM-start policy" value={project.pmCanStartSessions ? 'Enabled' : 'Disabled'} />
          </dl>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Model selector
              </span>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400"
                onChange={(event) => setSelectedModelId(event.target.value)}
                value={selectedModelId}
              >
                {Array.from(new Set([project.defaultModelId, ...modelOptions])).map((modelId) => (
                  <option key={modelId} value={modelId}>
                    {modelId}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="mt-3"
              disabled={startPending}
              onClick={async () => onStartSession(project.id, selectedModelId)}
            >
              {startPending ? 'Starting session…' : 'Start developer session'}
            </Button>
          </div>
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
              No sessions yet. Choose a model and start a developer session.
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
