export const AGENT_PROTOCOL_VERSION = '2026-06-27' as const;
export const agentProtocolMessageEventName = 'protocol.message' as const;
export const uiSessionSubscribeEventName = 'session.subscribe' as const;
export const uiSessionSubscribedEventName = 'session.subscribed' as const;
export const uiSessionEventName = 'session.event' as const;

export type AgentProtocolVersion = typeof AGENT_PROTOCOL_VERSION;
