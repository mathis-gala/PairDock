import {
  PREVIEW_SELECTION_CHANNEL,
  type PreviewElementSelection,
  type PreviewSelectionCommand,
  previewSelectionMessageSchema,
} from '@pairdock/shared-contracts';

const HANDSHAKE_RETRY_INTERVAL_MS = 500;
const HANDSHAKE_MAX_ATTEMPTS = 10; // Five seconds for a document to load its selection script.

export interface PreviewSelectionSnapshot {
  status: 'waiting' | 'connecting' | 'ready' | 'unsupported';
  isSelecting: boolean;
}

export class PreviewSelectionBridge {
  private readonly listeners = new Set<() => void>();
  private snapshot: PreviewSelectionSnapshot = { status: 'waiting', isSelecting: false };
  private frame: HTMLIFrameElement | null = null;
  private host: Window | null = null;
  private nonce = '';
  private readonly origin: string | null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private handshakeAttempts = 0;

  constructor(
    previewUrl: string | null,
    private readonly canSelect: boolean,
    private readonly onSelect: (selection: PreviewElementSelection) => void,
  ) {
    this.origin = previewUrl ? new URL(previewUrl).origin : null;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.snapshot;

  attachFrame = (frame: HTMLIFrameElement | null) => {
    this.stopSelection();
    this.clearRetry();
    this.host?.removeEventListener('message', this.handleMessage);
    this.host?.removeEventListener('keydown', this.handleKeyDown);
    this.frame?.removeEventListener('load', this.connect);
    this.frame = frame;
    this.host = frame?.ownerDocument.defaultView ?? null;
    this.update({ status: 'waiting', isSelecting: false });

    if (!frame || !this.origin || !this.canSelect) {
      return;
    }

    this.host?.addEventListener('message', this.handleMessage);
    this.host?.addEventListener('keydown', this.handleKeyDown);
    frame.addEventListener('load', this.connect);
    this.connect();
  };

  connect = () => {
    if (!this.frame || !this.origin || !this.canSelect) {
      return;
    }
    this.clearRetry();
    this.stopSelection();
    // getRandomValues also works on LAN HTTP origins where randomUUID is unavailable.
    this.nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    this.handshakeAttempts = 0;
    this.update({ status: 'connecting', isSelecting: false });
    this.sendConnect();
  };

  private sendConnect = () => {
    if (this.handshakeAttempts >= HANDSHAKE_MAX_ATTEMPTS) {
      this.update({ status: 'unsupported', isSelecting: false });
      return;
    }
    this.handshakeAttempts += 1;
    this.post({ channel: PREVIEW_SELECTION_CHANNEL, type: 'connect', nonce: this.nonce });
    this.retryTimer = setTimeout(this.sendConnect, HANDSHAKE_RETRY_INTERVAL_MS);
  };

  toggleSelection = () => {
    if (!this.canSelect || this.snapshot.status !== 'ready') {
      return;
    }
    const enabled = !this.snapshot.isSelecting;
    this.update({ status: 'ready', isSelecting: enabled });
    this.post({ channel: PREVIEW_SELECTION_CHANNEL, type: 'set-mode', nonce: this.nonce, enabled });
  };

  private stopSelection = () => {
    if (!this.snapshot.isSelecting) {
      return;
    }
    this.update({ status: this.snapshot.status, isSelecting: false });
    this.post({ channel: PREVIEW_SELECTION_CHANNEL, type: 'set-mode', nonce: this.nonce, enabled: false });
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.snapshot.isSelecting) {
      event.preventDefault();
      this.stopSelection();
    }
  };

  private handleMessage = (event: MessageEvent) => {
    if (event.source !== this.frame?.contentWindow || event.origin !== this.origin) {
      return;
    }
    const result = previewSelectionMessageSchema.safeParse(event.data);
    if (!result.success || result.data.nonce !== this.nonce) {
      return;
    }
    const message = result.data;
    if (message.type === 'ready') {
      this.clearRetry();
      this.update({ status: 'ready', isSelecting: this.snapshot.isSelecting });
      return;
    }
    if (message.type === 'cancelled') {
      this.stopSelection();
      return;
    }
    if (!this.snapshot.isSelecting || new URL(message.selection.url).origin !== this.origin) {
      return;
    }
    this.stopSelection();
    this.onSelect(message.selection);
  };

  private post(message: PreviewSelectionCommand) {
    if (this.origin) {
      this.frame?.contentWindow?.postMessage(message, this.origin);
    }
  }

  private clearRetry() {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private update(snapshot: PreviewSelectionSnapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}
