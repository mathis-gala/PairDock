import { type KeyboardEvent, useCallback, useRef } from 'react';

interface ImageLightboxProps {
  alt: string;
  onClose: () => void;
  src: string;
}

export function ImageLightbox({ alt, onClose, src }: ImageLightboxProps) {
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const handleInitialFocus = useCallback((element: HTMLButtonElement | null) => {
    if (!element) {
      return;
    }

    if (!returnFocusRef.current && document.activeElement instanceof HTMLElement) {
      returnFocusRef.current = document.activeElement;
    }
    element.focus();
  }, []);

  function handleClose() {
    const returnFocus = returnFocusRef.current;
    onClose();
    returnFocus?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();

    if (event.key === 'Escape') {
      event.preventDefault();
      handleClose();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLButtonElement>('[data-image-lightbox-close]')?.focus();
    }
  }

  return (
    <div
      aria-label={`Aperçu agrandi : ${alt}`}
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <button
        aria-label="Fermer l’aperçu"
        className="absolute inset-0 size-full cursor-zoom-out bg-[#080a0e]/90"
        onClick={handleClose}
        tabIndex={-1}
        type="button"
      />
      <figure className="relative flex max-h-full max-w-6xl flex-col items-center gap-3">
        <img
          alt={alt}
          className="max-h-[calc(100dvh-7rem)] max-w-full rounded-[14px] border border-white/10 bg-[#11141a] object-contain shadow-[0_28px_100px_rgba(0,0,0,0.7)]"
          src={src}
        />
        <figcaption className="max-w-[70ch] truncate text-sm text-[#cdd2dc]">{alt}</figcaption>
        <button
          aria-label="Fermer"
          className="absolute -right-3 -top-3 flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-[#20242d] text-[#eef0f4] shadow-xl transition duration-200 ease-out hover:bg-[#2a2f3a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5fdf9b]/50"
          data-image-lightbox-close
          onClick={handleClose}
          ref={handleInitialFocus}
          type="button"
        >
          <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
            <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
        </button>
      </figure>
    </div>
  );
}
