import type { DeveloperProjectSummary } from '@pairdock/shared-contracts';
import { ExecutionSelectionControls } from '../execution-selection.js';
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
  onUpdateExecutionDefaults: (projectId: string, modelId: string, reasoningEffort: string) => Promise<void>;
  project: DeveloperProjectSummary;
  readinessPendingProjectId: string | null;
  sharePendingProjectId: string | null;
  updateDefaultsPendingProjectId: string | null;
}

export function DeveloperProjectCard({
  closePendingSessionId,
  onCloseSession,
  onRequestReadiness,
  onShareProject,
  onUpdateExecutionDefaults,
  project,
  readinessPendingProjectId,
  sharePendingProjectId,
  updateDefaultsPendingProjectId,
}: DeveloperProjectCardProps) {
  const updateDefaultsPending = updateDefaultsPendingProjectId === project.id;
  const readinessPending = readinessPendingProjectId === project.id;
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
      <div className="grid gap-4 text-sm text-slate-700 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-2">
            <ProjectFact label="Repository" value={project.repoFullName} />
            <ProjectFact label="Branch" value={project.defaultBranch} />
            <ProjectFact label="Connection" value={project.sourceControlAccountLogin} />
            <ProjectFact
              label="PM access"
              value={`${project.pmMemberCount} PM${project.pmMemberCount === 1 ? '' : 's'}`}
            />
            <ProjectFact label="Agent key" value={project.agentProjectKey} />
            <ProjectFact label="Default model" value={project.defaultModelId} />
            <ProjectFact label="Default reasoning" value={project.defaultReasoningEffort} />
            <ProjectFact label="PM-start policy" value={project.pmCanStartSessions ? 'Enabled' : 'Disabled'} />
          </dl>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Agent du projet</p>
            <p className="mb-3 mt-1 text-sm text-slate-700">
              Ce modèle et ce raisonnement seront utilisés pour toutes les nouvelles demandes PM et développeur.
            </p>
            <ExecutionSelectionControls
              defaultModelId={project.defaultModelId}
              defaultReasoningEffort={project.defaultReasoningEffort}
              disabled={project.agentAvailability !== 'online'}
              models={project.models}
              onStart={async ({ modelId, reasoningEffort }) =>
                onUpdateExecutionDefaults(project.id, modelId, reasoningEffort)
              }
              pending={updateDefaultsPending}
              startLabel="Enregistrer la configuration"
            />
          </div>
          <ToolReadinessPanel
            agentAvailability={project.agentAvailability}
            isRequesting={readinessPending}
            onRequestReadiness={async () => onRequestReadiness(project.id)}
            readiness={project.readiness}
          />
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">PM invités</p>
              <span className="font-mono text-xs text-slate-600">{project.pmMembers.length}</span>
            </div>
            <ProjectShareForm
              isSubmitting={sharePending}
              onShare={async (pmEmail) => onShareProject(project.id, pmEmail)}
            />
            {project.pmMembers.length > 0 ? (
              <ul className="mt-3 divide-y divide-white/5 border-t border-black/10" aria-label="PM invités">
                {project.pmMembers.map((member) => (
                  <li className="flex min-w-0 items-center gap-3 py-3" key={member.email}>
                    <span className="flex size-9 flex-none items-center justify-center rounded-[9px] bg-[#d8f0df] text-sm font-semibold text-[#14532d]">
                      {(member.displayName ?? member.email).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">
                        {member.displayName ?? member.email}
                      </span>
                      {member.displayName ? (
                        <span className="block truncate text-xs text-slate-600">{member.email}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-black/10 pt-3 text-xs leading-5 text-slate-600">
                Aucun PM invité pour ce projet.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Sessions et nettoyage</p>
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
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              Aucune demande PM active pour ce projet.
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
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-600">{label}</dt>
      <dd className="break-all text-slate-800">{value}</dd>
    </div>
  );
}
