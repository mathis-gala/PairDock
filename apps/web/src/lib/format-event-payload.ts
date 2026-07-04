export function formatEventPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  return JSON.stringify(payload, null, 2);
}
