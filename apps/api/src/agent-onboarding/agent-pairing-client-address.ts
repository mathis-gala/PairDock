import { isIP } from 'node:net';
import { Inject, Injectable, Optional } from '@nestjs/common';

export const AGENT_PAIRING_TRUSTED_PROXY_IPS = Symbol('AGENT_PAIRING_TRUSTED_PROXY_IPS');

@Injectable()
export class AgentPairingClientAddress {
  private readonly trustedProxies: Set<string>;

  constructor(
    @Optional()
    @Inject(AGENT_PAIRING_TRUSTED_PROXY_IPS)
    configuredAddresses = process.env.PAIRDOCK_TRUSTED_PROXY_IPS ?? '',
  ) {
    this.trustedProxies = new Set(
      configuredAddresses
        .split(',')
        .filter((address) => address.trim())
        .map((address) => {
          const normalized = normalizeAddress(address.trim());
          if (!normalized)
            throw new Error('PAIRDOCK_TRUSTED_PROXY_IPS must contain comma-separated exact IP addresses.');
          return normalized;
        }),
    );
  }

  resolve(remoteAddress: string | undefined, realIp: string | string[] | undefined): string {
    const peer = normalizeAddress(remoteAddress) ?? 'unknown';
    if (!this.trustedProxies.has(peer) || typeof realIp !== 'string') return peer;
    return normalizeAddress(realIp) ?? peer;
  }
}

function normalizeAddress(value: string | undefined): string | null {
  if (!value || value.includes('%')) return null;
  if (value.startsWith('::ffff:') && isIP(value.slice(7)) === 4) return value.slice(7);
  const version = isIP(value);
  if (version === 4) return value;
  if (version === 6) return new URL(`http://[${value}]/`).hostname.slice(1, -1);
  return null;
}
