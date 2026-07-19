export type PreviewPresetId = 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface PreviewPreset {
  id: PreviewPresetId;
  label: string;
  description: string;
  width: string;
  height: string;
  widthPixels: number;
  heightPixels: number;
}

export const previewPresets: PreviewPreset[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    description: '1280 × 900',
    width: '1280px',
    height: '900px',
    widthPixels: 1280,
    heightPixels: 900,
  },
  {
    id: 'laptop',
    label: 'Laptop',
    description: '1024 × 768',
    width: '1024px',
    height: '768px',
    widthPixels: 1024,
    heightPixels: 768,
  },
  {
    id: 'tablet',
    label: 'Tablet',
    description: '768 × 1024',
    width: '768px',
    height: '1024px',
    widthPixels: 768,
    heightPixels: 1024,
  },
  {
    id: 'mobile',
    label: 'Mobile',
    description: '375 × 812',
    width: '375px',
    height: '812px',
    widthPixels: 375,
    heightPixels: 812,
  },
];

export function getPreviewFrameStyle(
  presetId: PreviewPresetId,
): Pick<PreviewPreset, 'width' | 'height' | 'widthPixels' | 'heightPixels'> {
  const preset = previewPresets.find((candidate) => candidate.id === presetId) ?? previewPresets[0];

  return {
    width: preset.width,
    height: preset.height,
    widthPixels: preset.widthPixels,
    heightPixels: preset.heightPixels,
  };
}

export function getFittedPreviewScale(
  availableWidth: number,
  availableHeight: number,
  frameWidth: number,
  frameHeight: number,
): number {
  if (availableWidth <= 0 || availableHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) {
    return 1;
  }

  return Math.min(1, availableWidth / frameWidth, availableHeight / frameHeight);
}

export function isPreviewPresetId(value: string): value is PreviewPresetId {
  return previewPresets.some((preset) => preset.id === value);
}
