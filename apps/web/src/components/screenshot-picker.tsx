import { type ChangeEvent, useId, useState } from 'react';
import { ImageLightbox } from './image-lightbox.js';

const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface SelectedScreenshot {
  file: File;
  id: string;
  previewUrl: string;
}

interface ClipboardDataWithItems {
  items: ArrayLike<Pick<DataTransferItem, 'getAsFile' | 'kind' | 'type'>>;
}

interface AppendScreenshotFilesOptions {
  files: ArrayLike<File>;
  onChange: (screenshots: SelectedScreenshot[]) => void;
  onError: (message: string | null) => void;
  screenshots: SelectedScreenshot[];
}

interface ScreenshotPickerProps {
  disabled?: boolean;
  onChange: (screenshots: SelectedScreenshot[]) => void;
  onError: (message: string | null) => void;
  screenshots: SelectedScreenshot[];
}

export function getPastedImageFiles(clipboardData: ClipboardDataWithItems): File[] {
  return Array.from(clipboardData.items).flatMap((item) => {
    if (item.kind !== 'file') {
      return [];
    }

    const file = item.getAsFile();
    return file?.type.startsWith('image/') ? [file] : [];
  });
}

export function appendScreenshotFiles({
  files,
  onChange,
  onError,
  screenshots,
}: AppendScreenshotFilesOptions): boolean {
  const nextFiles = Array.from(files);
  if (nextFiles.length === 0) {
    return false;
  }

  if (screenshots.length + nextFiles.length > MAX_SCREENSHOTS) {
    onError(`Tu peux joindre jusqu’à ${MAX_SCREENSHOTS} captures.`);
    return false;
  }

  const invalidType = nextFiles.find((file) => !ACCEPTED_IMAGE_TYPES.has(file.type));
  if (invalidType) {
    onError(`« ${invalidType.name} » doit être une image PNG, JPEG ou WebP.`);
    return false;
  }

  const oversized = nextFiles.find((file) => file.size > MAX_SCREENSHOT_BYTES);
  if (oversized) {
    onError(`« ${oversized.name} » dépasse la limite de 5 Mo.`);
    return false;
  }

  onError(null);
  onChange([
    ...screenshots,
    ...nextFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      previewUrl: URL.createObjectURL(file),
    })),
  ]);
  return true;
}

export function ScreenshotPicker({ disabled = false, onChange, onError, screenshots }: ScreenshotPickerProps) {
  const inputId = useId();
  const [expandedScreenshot, setExpandedScreenshot] = useState<SelectedScreenshot | null>(null);

  function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    appendScreenshotFiles({ files, onChange, onError, screenshots });
  }

  function handleRemove(screenshot: SelectedScreenshot) {
    URL.revokeObjectURL(screenshot.previewUrl);
    if (expandedScreenshot?.id === screenshot.id) {
      setExpandedScreenshot(null);
    }
    onChange(screenshots.filter((candidate) => candidate.id !== screenshot.id));
  }

  function handleOpen(screenshot: SelectedScreenshot) {
    setExpandedScreenshot(screenshot);
  }

  function handleCloseLightbox() {
    setExpandedScreenshot(null);
  }

  return (
    <div className="space-y-2.5">
      {screenshots.length > 0 ? (
        <ul aria-label="Captures sélectionnées" className="flex min-w-0 flex-wrap gap-2">
          {screenshots.map((screenshot) => (
            <ScreenshotTile
              disabled={disabled}
              key={screenshot.id}
              onOpen={handleOpen}
              onRemove={handleRemove}
              screenshot={screenshot}
            />
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label
          className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[9px] border border-white/10 bg-[#15181e] px-3 text-xs font-medium text-[#aeb4c0] transition duration-200 ease-out hover:border-white/20 hover:bg-[#20242c] hover:text-[#eef0f4] focus-within:ring-2 focus-within:ring-[#5fdf9b]/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45"
          htmlFor={inputId}
        >
          <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
            <rect height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" width="17" x="3.5" y="4.5" />
            <path
              d="m6.5 16 3.5-3.5 2.5 2 2.2-2.2 2.8 3.7"
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.7"
            />
            <circle cx="9" cy="9" fill="currentColor" r="1.2" />
          </svg>
          Ajouter une capture
          <input
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={disabled || screenshots.length >= MAX_SCREENSHOTS}
            id={inputId}
            multiple
            onChange={handleFilesChange}
            type="file"
          />
        </label>
        <span aria-live="polite" className="text-[11px] text-[#656c79]">
          {screenshots.length}/4 · 5 Mo max · ⌘V / Ctrl+V pour coller
        </span>
      </div>

      {expandedScreenshot ? (
        <ImageLightbox
          alt={expandedScreenshot.file.name}
          onClose={handleCloseLightbox}
          src={expandedScreenshot.previewUrl}
        />
      ) : null}
    </div>
  );
}

function ScreenshotTile({
  disabled,
  onOpen,
  onRemove,
  screenshot,
}: {
  disabled: boolean;
  onOpen: (screenshot: SelectedScreenshot) => void;
  onRemove: (screenshot: SelectedScreenshot) => void;
  screenshot: SelectedScreenshot;
}) {
  function handleOpen() {
    onOpen(screenshot);
  }

  function handleRemove() {
    onRemove(screenshot);
  }

  return (
    <li className="group relative h-[68px] w-[88px] overflow-hidden rounded-[9px] border border-white/10 bg-[#11141a]">
      <button
        aria-label={`Agrandir ${screenshot.file.name}`}
        className="size-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5fdf9b]/60"
        onClick={handleOpen}
        type="button"
      >
        <img
          alt=""
          className="size-full object-cover transition duration-200 ease-out group-hover:scale-[1.03]"
          src={screenshot.previewUrl}
        />
      </button>
      <button
        aria-label={`Retirer ${screenshot.file.name}`}
        className="absolute right-1 top-1 flex size-7 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#11141a]/90 text-[#eef0f4] opacity-100 transition hover:bg-rose-500/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        disabled={disabled}
        onClick={handleRemove}
        type="button"
      >
        <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 24 24">
          <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </button>
    </li>
  );
}

export function releaseScreenshotPreviews(screenshots: SelectedScreenshot[]): void {
  for (const screenshot of screenshots) {
    URL.revokeObjectURL(screenshot.previewUrl);
  }
}
