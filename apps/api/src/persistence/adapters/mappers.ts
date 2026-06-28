import type {
  AgentEventRecord,
  ExternalIdentity,
  PairDockUser,
  Project,
  ReviewRequestRecord,
  Session,
  SessionMember,
  SessionMessage,
  SourceControlConnection,
  ValidationRun,
} from '@pairdock/domain';
import type {
  AgentEvent,
  ExternalIdentity as PrismaExternalIdentity,
  Message as PrismaMessage,
  Project as PrismaProject,
  PullRequest as PrismaPullRequest,
  Session as PrismaSession,
  SessionMember as PrismaSessionMember,
  SourceControlConnection as PrismaSourceControlConnection,
  User as PrismaUser,
  ValidationRun as PrismaValidationRun,
} from '../../generated/prisma/client.js';

export function mapUser(record: PrismaUser): PairDockUser {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    kind: record.kind,
    createdAt: record.createdAt,
  };
}

export function mapExternalIdentity(record: PrismaExternalIdentity): ExternalIdentity {
  return {
    id: record.id,
    userId: record.userId,
    provider: record.provider as ExternalIdentity['provider'],
    providerUserId: record.providerUserId,
    providerTeamId: record.providerTeamId,
    metadata: record.metadata as Record<string, unknown>,
    createdAt: record.createdAt,
  };
}

export function mapSourceControlConnection(record: PrismaSourceControlConnection): SourceControlConnection {
  return {
    id: record.id,
    ownerUserId: record.ownerUserId,
    provider: 'github',
    providerConnectionId: record.providerConnectionId,
    accountLogin: record.accountLogin,
    createdAt: record.createdAt,
  };
}

export function mapProject(record: PrismaProject): Project {
  return {
    id: record.id,
    ownerUserId: record.ownerUserId,
    sourceControlConnectionId: record.sourceControlConnectionId,
    name: record.name,
    repoFullName: record.repoFullName,
    defaultBranch: record.defaultBranch,
    agentProjectKey: record.agentProjectKey,
    createdAt: record.createdAt,
  };
}

export function mapSession(record: PrismaSession): Session {
  return {
    id: record.id,
    projectId: record.projectId,
    createdByUserId: record.createdByUserId,
    status: record.status,
    modelId: record.modelId,
    branchName: record.branchName,
    worktreeRef: record.worktreeRef,
    previewUrl: record.previewUrl,
    lastError: record.lastError,
    createdAt: record.createdAt,
    closedAt: record.closedAt,
  };
}

export function mapSessionMember(record: PrismaSessionMember): SessionMember {
  return {
    id: record.id,
    sessionId: record.sessionId,
    userId: record.userId,
    role: record.role,
  };
}

export function mapMessage(record: PrismaMessage): SessionMessage {
  return {
    id: record.id,
    sessionId: record.sessionId,
    userId: record.userId,
    role: record.role,
    content: record.content,
    createdAt: record.createdAt,
  };
}

export function mapAgentEvent(record: AgentEvent): AgentEventRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    agentId: record.agentId,
    type: record.type,
    payload: record.payload as Record<string, unknown>,
    createdAt: record.createdAt,
  };
}

export function mapValidationRun(record: PrismaValidationRun): ValidationRun {
  return {
    id: record.id,
    sessionId: record.sessionId,
    status: record.status,
    buildStatus: record.buildStatus,
    testStatus: record.testStatus,
    lintStatus: record.lintStatus,
    previewStatus: record.previewStatus,
    logsRef: record.logsRef,
    createdAt: record.createdAt,
  };
}

export function mapReviewRequest(record: PrismaPullRequest): ReviewRequestRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    reviewRequestNumber: record.githubPrNumber,
    reviewRequestUrl: record.githubPrUrl,
    status: record.status,
    createdAt: record.createdAt,
  };
}
