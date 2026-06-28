export type UserKind = 'developer' | 'pm';

export type ExternalIdentityProvider = 'github' | 'slack';
export type SourceControlProvider = 'github';

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
  repoFullName: string;
  defaultBranch: string;
  agentProjectKey: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  projectId: string;
  createdByUserId: string;
  status: SessionStatus;
  modelId: string;
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

export interface DeveloperIdentityPort {
  getDeveloperIdentity(accessToken: string): Promise<PairDockIdentity>;
}

export interface PmIdentityPort {
  getPmIdentity(accessToken: string): Promise<PairDockIdentity>;
}

export interface SourceControlPort {
  assertProjectAccess(input: { ownerUserId: string; repoFullName: string }): Promise<void>;
  createDraftReviewRequest(input: {
    projectId: string;
    sessionId: string;
    title: string;
    body: string;
    branchName: string;
    baseBranch: string;
  }): Promise<{ reviewRequestUrl: string }>;
}
