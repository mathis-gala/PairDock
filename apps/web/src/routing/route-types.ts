export type AppRoute =
  | { kind: 'login' }
  | { kind: 'developer-home' }
  | { kind: 'pm-dashboard' }
  | { kind: 'pm-session'; sessionId: string };
