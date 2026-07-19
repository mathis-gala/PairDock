import { checksResultPayloadSchema, summarizeChecksFailure } from '@pairdock/shared-contracts';
import type { SessionEventRecordView, SessionMessageView } from '../schemas/session.js';

export interface SessionConversationItem {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  tone: 'default' | 'error';
  createdAt: string;
}

export function buildSessionConversation(
  messages: SessionMessageView[],
  events: SessionEventRecordView[],
): SessionConversationItem[] {
  const messageItems = messages.map((message) => ({
    id: `message:${message.id}`,
    role: message.role === 'agent' || message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    text: message.content.trim(),
    tone: 'default' as const,
    createdAt: message.createdAt,
  }));
  const eventItems = events.flatMap(toConversationEvent);

  return mergeAdjacentAgentOutput(
    [...messageItems, ...eventItems]
      .filter((item) => item.text.length > 0)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  );
}

function toConversationEvent(event: SessionEventRecordView): SessionConversationItem[] {
  if (event.type === 'agent.output') {
    const payload = asRecord(event.payload);
    const stream = payload?.stream;
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';

    if (!text) {
      return [];
    }

    if (stream === 'stderr') {
      const errorText = humanizeAgentError(text);
      return errorText
        ? [{ id: `event:${event.id}`, role: 'assistant', text: errorText, tone: 'error', createdAt: event.createdAt }]
        : [];
    }

    return [{ id: `event:${event.id}`, role: 'assistant', text, tone: 'default', createdAt: event.createdAt }];
  }

  if (event.type === 'error') {
    const payload = asRecord(event.payload);
    const message = typeof payload?.message === 'string' ? payload.message : 'La demande a échoué.';
    return [
      {
        id: `event:${event.id}`,
        role: 'assistant',
        text: humanizeAgentError(message) ?? `L’agent n’a pas pu terminer cette demande. ${message}`,
        tone: 'error',
        createdAt: event.createdAt,
      },
    ];
  }

  if (event.type === 'checks.result') {
    const parsedPayload = checksResultPayloadSchema.safeParse(event.payload);

    if (!parsedPayload.success) {
      return [];
    }

    const failure = summarizeChecksFailure(parsedPayload.data);
    if (!failure) {
      return [];
    }

    return [
      {
        id: `event:${event.id}`,
        role: 'assistant',
        text: `Les modifications ont été appliquées, mais la validation « ${failure.failedChecks.join(', ')} » a échoué.${failure.cause ? ` Cause : ${failure.cause}.` : ''} Tu peux renvoyer un message après correction; cette session reste ouverte.`,
        tone: 'error',
        createdAt: event.createdAt,
      },
    ];
  }

  if (event.type === 'agent.done') {
    const payload = asRecord(event.payload);
    const exitCode = payload?.exitCode;

    if (typeof exitCode === 'number' && exitCode !== 0) {
      return [
        {
          id: `event:${event.id}`,
          role: 'assistant',
          text: `L’agent s’est arrêté avec le code ${exitCode}. Tu peux renvoyer un message pour réessayer dans cette session.`,
          tone: 'error',
          createdAt: event.createdAt,
        },
      ];
    }
  }

  return [];
}

function humanizeAgentError(rawText: string): string | null {
  const extractedMessage = extractErrorMessage(rawText);
  const normalizedMessage = extractedMessage.toLowerCase();

  if (normalizedMessage.includes('requires a newer version of codex')) {
    const model = extractedMessage.match(/['"]([^'"]+)['"] model/i)?.[1] ?? 'ce modèle';
    return `L’agent local doit être mis à jour pour utiliser ${model}. Le développeur doit lancer « codex update », puis redémarrer l’agent.`;
  }

  if (!/^error\s*:/i.test(rawText) && extractedMessage === rawText.trim()) {
    return null;
  }

  return `L’agent n’a pas pu terminer cette demande. ${extractedMessage}`;
}

function extractErrorMessage(rawText: string): string {
  const candidate = rawText.replace(/^error\s*:\s*/i, '').trim();

  try {
    const parsed = JSON.parse(candidate) as unknown;
    const record = asRecord(parsed);
    const nestedError = asRecord(record?.error);
    const message = nestedError?.message ?? record?.message;

    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  } catch {
    // A plain-text harness error is already suitable for the fallback below.
  }

  return candidate;
}

function mergeAdjacentAgentOutput(items: SessionConversationItem[]): SessionConversationItem[] {
  const merged: SessionConversationItem[] = [];

  for (const item of items) {
    const previous = merged.at(-1);

    if (previous?.role === 'assistant' && item.role === 'assistant' && previous.tone === item.tone) {
      previous.text = `${previous.text}\n${item.text}`;
      continue;
    }

    merged.push({ ...item });
  }

  return merged;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
