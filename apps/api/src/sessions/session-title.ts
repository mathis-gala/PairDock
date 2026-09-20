import { parsePreviewSelectionPrompt } from '@pairdock/shared-contracts';

export function buildSessionTitle(prompt: string | null | undefined): string | null {
  if (!prompt?.trim()) {
    return null;
  }

  const previewContext = parsePreviewSelectionPrompt(prompt.trim());
  const text = (previewContext?.content ?? prompt).trim().replace(/\s+/g, ' ');
  if (!text) {
    return previewContext ? 'Annotation de la preview' : null;
  }
  return text.length > 120 ? `${text.slice(0, 119).trimEnd()}…` : text;
}
