import type { PreviewElementSelection } from '@pairdock/shared-contracts';
import { useMemo, useSyncExternalStore } from 'react';
import { PreviewSelectionBridge } from '../lib/preview-selection-bridge.js';

export function usePreviewSelection(
  previewUrl: string | null,
  canSelect: boolean,
  onSelect: (selection: PreviewElementSelection) => void,
) {
  const bridge = useMemo(
    () => new PreviewSelectionBridge(previewUrl, canSelect, onSelect),
    [previewUrl, canSelect, onSelect],
  );
  const snapshot = useSyncExternalStore(bridge.subscribe, bridge.getSnapshot, bridge.getSnapshot);

  return {
    snapshot,
    attachFrame: bridge.attachFrame,
    toggleSelection: bridge.toggleSelection,
    retryConnection: bridge.connect,
  };
}
