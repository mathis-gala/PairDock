import type { ProjectPreviewConfig } from '../docker/sandbox.port.js';
import { type PreviewPickerProxy, startPreviewPickerProxy } from '../preview/preview-picker-proxy.js';
import type { PreviewTunnelOpenInput, PreviewTunnelPort, PreviewTunnelRef } from './preview-tunnel.port.js';

export class InstrumentedPreviewTunnelAdapter implements PreviewTunnelPort {
  private readonly proxies = new Map<string, PreviewPickerProxy>();

  constructor(private readonly tunnel: PreviewTunnelPort) {}

  async open(input: PreviewTunnelOpenInput): Promise<PreviewTunnelRef> {
    if (input.previewConfig?.tunnel?.publicUrl) return this.tunnel.open(input);

    const proxy = await startPreviewPickerProxy(input.localUrl);
    try {
      const ref = await this.tunnel.open({ ...input, localUrl: proxy.localUrl });
      this.proxies.set(ref.id, proxy);
      return ref;
    } catch (error) {
      try {
        await proxy.close();
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Preview tunnel startup and instrumentation cleanup failed.');
      }
      throw error;
    }
  }

  async close(ref: PreviewTunnelRef, previewConfig?: ProjectPreviewConfig): Promise<void> {
    const errors: unknown[] = [];
    try {
      await this.tunnel.close(ref, previewConfig);
    } catch (error) {
      errors.push(error);
    }
    try {
      await this.proxies.get(ref.id)?.close();
      this.proxies.delete(ref.id);
    } catch (error) {
      errors.push(error);
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Preview tunnel and instrumentation cleanup failed.');
  }
}
