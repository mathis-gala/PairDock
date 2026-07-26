export const sessionQueryKeys = {
  detail: (accessToken: string, sessionId: string) => ['session', accessToken, sessionId] as const,
  messages: (accessToken: string, sessionId: string) => ['session-messages', accessToken, sessionId] as const,
  events: (accessToken: string, sessionId: string) => ['session-events', accessToken, sessionId] as const,
  attachment: (accessToken: string, sessionId: string, attachmentId: string) =>
    ['session-attachment', accessToken, sessionId, attachmentId] as const,
};
