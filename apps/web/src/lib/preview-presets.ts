export type PreviewPresetId = 'desktop' | 'laptop' | 'tablet' | 'mobile';

export interface PreviewPreset {
  id: PreviewPresetId;
  label: string;
  description: string;
  width: string;
  height: string;
}

export const previewPresets: PreviewPreset[] = [
  {
    id: 'desktop',
    label: 'Desktop',
    description: '1280 × 900',
    width: '1280px',
    height: '900px',
  },
  {
    id: 'laptop',
    label: 'Laptop',
    description: '1024 × 768',
    width: '1024px',
    height: '768px',
  },
  {
    id: 'tablet',
    label: 'Tablet',
    description: '768 × 1024',
    width: '768px',
    height: '1024px',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    description: '375 × 812',
    width: '375px',
    height: '812px',
  },
];

export function getPreviewFrameStyle(presetId: PreviewPresetId): Pick<PreviewPreset, 'width' | 'height'> {
  const preset = previewPresets.find((candidate) => candidate.id === presetId) ?? previewPresets[0];

  return {
    width: preset.width,
    height: preset.height,
  };
}

export function isPreviewPresetId(value: string): value is PreviewPresetId {
  return previewPresets.some((preset) => preset.id === value);
}
