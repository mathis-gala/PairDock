export type UserKind = 'developer' | 'pm';

export type ExternalIdentityProvider = 'github' | 'slack';
export type SourceControlProvider = 'github';
export type ProjectMembershipRole = 'pm';
export type ToolReadinessKey =
  | 'agent'
  | 'git'
  | 'repository'
  | 'source-control'
  | 'agent-harness'
  | 'docker'
  | 'preview-tunnel'
  | 'project-commands';
export type ToolReadinessStatus = 'passed' | 'failed' | 'warning' | 'skipped';

export type SessionStatus =
  | 'CREATED'
  | 'AGENT_CONNECTING'
  | 'WORKTREE_CREATING'
  | 'DOCKER_STARTING'
  | 'PREVIEW_STARTING'
  | 'READY'
  | 'AGENT_RUNNING'
  | 'CHECKS_RUNNING'
  | 'AWAITING_PM_VALIDATION'
  | 'REVIEW_REQUEST_CREATING'
  | 'REVIEW_REQUEST_CREATED'
  | 'CLOSING'
  | 'CLOSED'
  | 'FAILED';

export interface PairDockUser {
  id: string;
  email: string;
  displayName: string | null;
  kind: UserKind;
  createdAt: Date;
}

export interface ExternalIdentity {
  id: string;
  userId: string;
  provider: ExternalIdentityProvider;
  providerUserId: string;
  providerTeamId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface SourceControlConnection {
  id: string;
  ownerUserId: string;
  provider: SourceControlProvider;
  providerConnectionId: string;
  accountLogin: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  ownerUserId: string;
  sourceControlConnectionId: string;
  name: string;
  description: string | null;
  repoFullName: string;
  defaultBranch: string;
  defaultModelId: string;
  defaultReasoningEffort: string;
  pmCanStartSessions: boolean;
  agentProjectKey: string;
  createdAt: Date;
}

export interface ProjectMembership {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMembershipRole;
  createdAt: Date;
}

export interface ToolReadinessCheck {
  key: ToolReadinessKey;
  status: ToolReadinessStatus;
  required: boolean;
  message: string | null;
  remediation: string | null;
}

export interface ProjectReadinessSnapshot {
  id: string;
  projectId: string;
  ok: boolean;
  checks: ToolReadinessCheck[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  projectId: string;
  createdByUserId: string;
  status: SessionStatus;
  modelId: string;
  reasoningEffort: string;
  branchName: string | null;
  worktreeRef: string | null;
  previewUrl: string | null;
  lastError: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface SessionMember {
  id: string;
  sessionId: string;
  userId: string;
  role: string;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  userId: string | null;
  role: string;
  content: string;
  createdAt: Date;
}

export interface AgentEventRecord {
  id: string;
  sessionId: string | null;
  agentId: string | null;
  type: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface AgentRegistration {
  id: string;
  agentId: string;
  ownerUserId: string | null;
  displayName: string | null;
  protocolVersion: string;
  capabilities: string[];
  models: Array<{
    id: string;
    label: string;
    provider: string;
    reasoningEfforts?: Array<{ id: string; label: string; description?: string }>;
    defaultReasoningEffort?: string;
  }>;
  projects: Array<{
    key: string;
    name: string;
    repoFullName: string;
    pathAlias: string;
    defaultBranch?: string;
    models?: string[];
  }>;
  connectedAt: Date;
  lastSeenAt: Date;
  disconnectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationRun {
  id: string;
  sessionId: string;
  status: string;
  buildStatus: string | null;
  testStatus: string | null;
  lintStatus: string | null;
  previewStatus: string | null;
  logsRef: string | null;
  createdAt: Date;
}

export interface ReviewRequestRecord {
  id: string;
  sessionId: string;
  reviewRequestNumber: number | null;
  reviewRequestUrl: string | null;
  status: string;
  createdAt: Date;
}

export interface PairDockIdentity {
  id: string;
  email: string;
  displayName: string | null;
  kind: UserKind;
}

export interface NormalizedIdentity {
  provider: ExternalIdentityProvider;
  providerUserId: string;
  providerTeamId: string | null;
  email: string;
  displayName: string | null;
  kind: UserKind;
  metadata: Record<string, unknown>;
}

export interface DeveloperIdentityPort {
  getDeveloperIdentity(accessToken: string): Promise<NormalizedIdentity>;
}

export interface PmIdentityPort {
  getPmIdentity(accessToken: string): Promise<NormalizedIdentity>;
}

export interface SourceControlPort {
  assertProjectAccess(input: { ownerUserId: string; repoFullName: string }): Promise<void>;
  listInstallationRepositories(input: {
    ownerUserId: string;
    providerConnectionId: string;
  }): Promise<Array<{ fullName: string; name: string; defaultBranch: string }>>;
  listRepositoryBranches(input: {
    ownerUserId: string;
    providerConnectionId: string;
    repoFullName: string;
  }): Promise<string[]>;
  createDraftReviewRequest(input: {
    projectId: string;
    sessionId: string;
    repoFullName: string;
    sourceControlConnectionId: string;
    providerConnectionId: string;
    sourceControlAccountLogin: string;
    title: string;
    body: string;
    branchName: string;
    baseBranch: string;
  }): Promise<{ reviewRequestNumber: number | null; reviewRequestUrl: string }>;
}
