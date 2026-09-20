export type AppRoute =
  | { kind: 'login' }
  | { kind: 'developer-home'; agentProjectKey?: string }
  | { kind: 'developer-agents'; userCode: string | null }
  | { kind: 'developer-session'; sessionId: string }
  | { kind: 'pm-dashboard' }
  | { kind: 'pm-session-history' }
  | { kind: 'pm-review-requests' }
  | { kind: 'pm-session'; sessionId: string };
