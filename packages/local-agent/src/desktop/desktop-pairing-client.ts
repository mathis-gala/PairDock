import {
  type AgentPairingClaim,
  type AgentPairingStarted,
  agentPairingClaimSchema,
  agentPairingStartedSchema,
  startAgentPairingInputSchema,
} from '@pairdock/shared-contracts';

type PairingFetch = (url: string, init?: RequestInit) => Promise<Response>;

export class DesktopPairingUnavailableError extends Error {
  constructor() {
    super('This pairing code is no longer available. Start pairing again.');
  }
}

export class DesktopPairingClient {
  constructor(private readonly fetchResponse: PairingFetch = fetch) {}

  async begin(backendUrl: string, deviceName: string): Promise<AgentPairingStarted> {
    const body = startAgentPairingInputSchema.parse({ deviceName });
    return agentPairingStartedSchema.parse(await this.post(backendUrl, '/agent-pairings', body));
  }

  async claim(backendUrl: string, deviceCode: string): Promise<AgentPairingClaim> {
    return agentPairingClaimSchema.parse(await this.post(backendUrl, '/agent-pairings/claim', { deviceCode }));
  }

  private async post(backendUrl: string, path: string, body: object): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchResponse(`${backendUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
        redirect: 'error',
      });
    } catch {
      throw new Error('PairDock could not be reached. Check the server address and your connection, then retry.');
    }
    if (response.status === 410 || response.status === 404) throw new DesktopPairingUnavailableError();
    if (response.status === 429)
      throw new Error('PairDock received too many pairing requests. Wait a moment and retry.');
    if (!response.ok) throw new Error(`PairDock could not complete pairing (HTTP ${response.status}). Retry pairing.`);
    try {
      return await response.json();
    } catch {
      throw new Error('PairDock returned an invalid pairing response. Retry pairing.');
    }
  }
}
