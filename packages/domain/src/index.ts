export type UserKind = 'developer' | 'pm';

export type SessionStatus =
  | 'CREATED'
  | 'PREPARING'
  | 'READY'
  | 'RUNNING'
  | 'FAILED'
  | 'PREVIEW_FAILED'
  | 'CLOSED';

export interface PairDockIdentity {
  id: string;
  email: string;
  displayName: string;
  kind: UserKind;
}

export interface ProjectSummary {
  id: string;
  ownerUserId: string;
  name: string;
  repoFullName: string;
  defaultBranch: string;
  agentProjectKey: string;
}

export interface SessionSummary {
  id: string;
  projectId: string;
  createdByUserId: string;
  status: SessionStatus;
  modelId: string;
  branchName?: string;
  worktreeRef?: string;
  previewUrl?: string;
}

export interface DeveloperIdentityPort {
  getDeveloperIdentity(accessToken: string): Promise<PairDockIdentity>;
}

export interface PmIdentityPort {
  getPmIdentity(accessToken: string): Promise<PairDockIdentity>;
}

export interface SourceControlPort {
  assertProjectAccess(input: { ownerUserId: string; repoFullName: string }): Promise<void>;
  createDraftPullRequest(input: {
    projectId: string;
    sessionId: string;
    title: string;
    body: string;
    branchName: string;
    baseBranch: string;
  }): Promise<{ pullRequestUrl: string }>;
}
