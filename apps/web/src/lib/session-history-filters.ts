import type { SharedSessionHistoryItem } from '@pairdock/shared-contracts';

export type SessionHistoryStatusFilter = 'all' | 'closed' | 'opened';

export interface SessionHistoryFilters {
  projectId: 'all' | string;
  status: SessionHistoryStatusFilter;
}

export function filterSharedSessionHistory(
  sessions: SharedSessionHistoryItem[],
  filters: SessionHistoryFilters,
): SharedSessionHistoryItem[] {
  return sessions.filter(
    (session) =>
      (filters.projectId === 'all' || session.projectId === filters.projectId) &&
      (filters.status === 'all' ||
        (filters.status === 'opened' && session.status !== 'CLOSED') ||
        (filters.status === 'closed' && session.status === 'CLOSED')),
  );
}
