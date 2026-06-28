import type { PairDockIdentity, SessionMember } from '@pairdock/domain';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string | undefined>;
  body?: unknown;
  user?: PairDockIdentity;
  sessionMember?: SessionMember;
}
