import type { DeveloperProjectSummary, UpdateDeveloperProjectInput } from '@pairdock/shared-contracts';
import { useState } from 'react';
import { Button } from '../button.js';
import { ExecutionSelectionControls } from '../execution-selection.js';
import { SectionCard } from '../section-card.js';
import { StatusBadge } from '../status-badge.js';
import { ProjectMetadataForm } from './project-metadata-form.js';
import { ProjectShareForm } from './project-share-form.js';
import { SessionControlCard } from './session-control-card.js';
import { ToolReadinessPanel } from './tool-readiness-panel.js';

interface DeveloperProjectCardProps {
  closePendingSessionId: string | null;
  onCloseSession: (sessionId: string) => Promise<void>;
  onResetUpdateProject: () => void;
  onRequestReadiness: (projectId: string) => Promise<void>;
  onShareProject: (projectId: string, pmEmail: string) => Promise<void>;
  onUpdateExecutionDefaults: (projectId: string, modelId: string, reasoningEffort: string) => Promise<void>;
  onUpdateProject: (projectId: string, input: UpdateDeveloperProjectInput) => Promise<void>;
  project: DeveloperProjectSummary;
  readinessPendingProjectId: string | null;
  sharePendingProjectId: string | null;
  updateDefaultsPendingProjectId: string | null;
  updateProjectError: string | null;
  updateProjectPendingId: string | null;
}

export function DeveloperProjectCard({
  closePendingSessionId,
  onCloseSession,
  onResetUpdateProject,
  onRequestReadiness,
  onShareProject,
  onUpdateExecutionDefaults,
  onUpdateProject,
  project,
  readinessPendingProjectId,
  sharePendingProjectId,
  updateDefaultsPendingProjectId,
  updateProjectError,
  updateProjectPendingId,
}: DeveloperProjectCardProps) {
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const updateDefaultsPending = updateDefaultsPendingProjectId === project.id;
  const updateProjectPending = updateProjectPendingId === project.id;
  const readinessPending = readinessPendingProjectId === project.id;
  const sharePending = sharePendingProjectId === project.id;

  function handleStartEditingMetadata() {
    onResetUpdateProject();
    setIsEditingMetadata(true);
  }

  function handleCancelEditingMetadata() {
    setIsEditingMetadata(false);
  }

  async function handleUpdateProject(input: UpdateDeveloperProjectInput) {
    await onUpdateProject(project.id, input);
    setIsEditingMetadata(false);
  }

  return (
    <SectionCard
      actions={
        <>
          <StatusBadge tone={project.agentAvailability === 'online' ? 'positive' : 'warning'}>
            {project.agentAvailability}
          </StatusBadge>
          {!isEditingMetadata ? (
            <Button onClick={handleStartEditingMetadata} variant="secondary">
              Modifier
            </Button>
          ) : null}
        </>
      }
      eyebrow="Developer project"
      title={project.name}
      description={project.description ?? 'No project description set.'}
    >
      {isEditingMetadata ? (
        <ProjectMetadataForm
          description={project.description}
          error={updateProjectError}
          isSubmitting={updateProjectPending}
          name={project.name}
          onCancel={handleCancelEditingMetadata}
          onSubmit={handleUpdateProject}
        />
      ) : null}
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
            <ProjectFact label="Default reasoning" value={project.defaultReasoningEffort} />
            <ProjectFact label="PM-start policy" value={project.pmCanStartSessions ? 'Enabled' : 'Disabled'} />
          </dl>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Agent du projet</p>
            <p className="mb-3 mt-1 text-sm text-slate-300">
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
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">PM invités</p>
              <span className="font-mono text-xs text-slate-500">{project.pmMembers.length}</span>
            </div>
            <ProjectShareForm
              isSubmitting={sharePending}
              onShare={async (pmEmail) => onShareProject(project.id, pmEmail)}
            />
            {project.pmMembers.length > 0 ? (
              <ul className="mt-3 divide-y divide-white/5 border-t border-white/10" aria-label="PM invités">
                {project.pmMembers.map((member) => (
                  <li className="flex min-w-0 items-center gap-3 py-3" key={member.email}>
                    <span className="flex size-9 flex-none items-center justify-center rounded-[9px] bg-[#2f7a52] text-sm font-semibold text-[#eafff3]">
                      {(member.displayName ?? member.email).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-200">
                        {member.displayName ?? member.email}
                      </span>
                      {member.displayName ? (
                        <span className="block truncate text-xs text-slate-500">{member.email}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-white/10 pt-3 text-xs leading-5 text-slate-500">
                Aucun PM invité pour ce projet.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Sessions et nettoyage</p>
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
      <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="break-all text-slate-200">{value}</dd>
    </div>
  );
}
