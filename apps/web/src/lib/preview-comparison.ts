import {
  MAX_PREVIEW_CAPTURE_BYTES,
  type PreviewComparisonInput,
  previewComparisonInputSchema,
} from '@pairdock/shared-contracts';

export function previewComparisonPageUrl(previewUrl: string | null): string {
  if (!previewUrl || !URL.canParse(previewUrl)) return '';
  const url = new URL(previewUrl);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
  return `${url.origin}${url.pathname}`;
}

export function validatePreviewCapture(file: File, input: PreviewComparisonInput): void {
  if (file.type !== 'image/png') throw new Error('Choisis une capture PNG pour conserver les dimensions de l’image.');
  if (file.size === 0 || file.size > MAX_PREVIEW_CAPTURE_BYTES)
    throw new Error('La capture doit peser entre 1 octet et 5 Mo.');
  if (!previewComparisonInputSchema.safeParse(input).success) {
    throw new Error('Indique une adresse HTTP(S) sans paramètres ni fragment et un format valide.');
  }
}

export function comparisonCaptureFile(dataUrl: string, stage: 'avant' | 'apres'): File {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match?.[1]) throw new Error('La capture enregistrée n’est pas un PNG valide.');
  const bytes = Uint8Array.from(atob(match[1]), (character) => character.charCodeAt(0));
  return new File([bytes], `${stage}.png`, { type: 'image/png' });
}
