import { randomBytes, randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { PairDockIdentity } from '@pairdock/domain';
import type {
  AgentPairingClaim,
  AgentPairingDetails,
  AgentPairingStarted,
  DeveloperAgent,
} from '@pairdock/shared-contracts';
import { AgentGateway } from '../agent-gateway/agent.gateway.js';
import { hashAgentSecret } from '../agent-gateway/agent-authentication.service.js';
import { ConnectedAgentsRegistry } from '../agent-gateway/connected-agents.registry.js';
import { AGENT_ENROLLMENT_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { AgentEnrollmentRepository } from '../persistence/ports/agent-enrollment.repository.js';
import { AgentPairingLimiter } from './agent-pairing-limiter.js';

const PAIRING_TTL_MS = 10 * 60 * 1_000;
const USER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class AgentOnboardingService {
  constructor(
    @Inject(AGENT_ENROLLMENT_REPOSITORY) private readonly enrollment: AgentEnrollmentRepository,
    @Inject(ConnectedAgentsRegistry) private readonly agents: ConnectedAgentsRegistry,
    @Inject(AgentGateway) private readonly gateway: AgentGateway,
    @Inject(AgentPairingLimiter) private readonly limiter: AgentPairingLimiter,
  ) {}

  async start(deviceName: string, remoteAddress: string): Promise<AgentPairingStarted> {
    this.limiter.assertAllowed(`start:${remoteAddress}`, 30);
    const deviceCode = randomBytes(32).toString('base64url');
    const userCode = [...randomBytes(8)].map((byte) => USER_CODE_ALPHABET[byte & 31]).join('');
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
    await this.enrollment.createPairing({
      deviceCodeHash: hashAgentSecret(deviceCode),
      userCode,
      deviceName,
      expiresAt,
    });
    const verificationUrl = new URL(process.env.FRONTEND_URL ?? 'http://localhost:5173');
    verificationUrl.hash = `/developer/agents?code=${formatUserCode(userCode)}`;
    return {
      deviceCode,
      userCode: formatUserCode(userCode),
      verificationUrl: verificationUrl.toString(),
      expiresAt: expiresAt.toISOString(),
      intervalSeconds: 5,
    };
  }

  async claim(deviceCode: string, remoteAddress: string): Promise<AgentPairingClaim> {
    this.limiter.assertAllowed(`claims:${remoteAddress}`, 2_400);
    const deviceCodeHash = hashAgentSecret(deviceCode);
    const pairing = await this.enrollment.findPairingByDeviceCodeHash(deviceCodeHash);
    if (!pairing || pairing.expiresAt <= new Date() || pairing.claimedAt) {
      throw new GoneException('Pairing expired or already claimed. Start a new pairing.');
    }
    this.limiter.assertAllowed(`device:${deviceCodeHash}`, 125);
    const agentId = `agent-${randomUUID()}`;
    const projectKeyPrefix = `${agentId}-`;
    const authToken = randomBytes(48).toString('base64url');
    const result = await this.enrollment.claimPairing({
      deviceCodeHash,
      agentId,
      projectKeyPrefix,
      credentialHash: hashAgentSecret(authToken),
      now: new Date(),
    });
    if (result.status === 'unavailable')
      throw new GoneException('Pairing expired or already claimed. Start a new pairing.');
    if (result.status === 'pending') return { status: 'pending' };
    return { status: 'paired', agentId, projectKeyPrefix, authToken, ownerName: result.ownerName };
  }

  async details(userCode: string, user: PairDockIdentity | undefined): Promise<AgentPairingDetails> {
    const developer = requireDeveloper(user);
    this.limiter.assertAllowed(`approval:${developer.id}`, 30, Date.now(), 'authenticated');
    const pairing = await this.enrollment.findPairing(userCode);
    if (!pairing) throw new NotFoundException('Pairing code was not found.');
    if (pairing.expiresAt <= new Date() || pairing.claimedAt)
      throw new GoneException('Pairing expired or already claimed.');
    if (pairing.ownerUserId && pairing.ownerUserId !== developer.id)
      throw new NotFoundException('Pairing code was not found.');
    return {
      deviceName: pairing.deviceName,
      userCode: formatUserCode(pairing.userCode),
      expiresAt: pairing.expiresAt.toISOString(),
    };
  }

  async approve(userCode: string, user: PairDockIdentity | undefined): Promise<{ approved: true }> {
    const developer = requireDeveloper(user);
    await this.details(userCode, developer);
    if (!(await this.enrollment.approvePairing(userCode, developer.id, new Date()))) {
      throw new ConflictException('Pairing has already been approved or expired. Start a new pairing.');
    }
    return { approved: true };
  }

  async list(user: PairDockIdentity | undefined): Promise<DeveloperAgent[]> {
    const developer = requireDeveloper(user);
    return (await this.enrollment.listAgents(developer.id)).map((agent) => ({
      agentId: agent.agentId,
      deviceName: agent.deviceName,
      connected: !agent.revokedAt && Boolean(this.agents.findSnapshot(agent.agentId)),
      pairedAt: agent.pairedAt.toISOString(),
      lastSeenAt: agent.lastSeenAt.toISOString(),
      revokedAt: agent.revokedAt?.toISOString() ?? null,
    }));
  }

  async revoke(agentId: string, user: PairDockIdentity | undefined): Promise<{ revoked: true }> {
    const developer = requireDeveloper(user);
    if (!(await this.enrollment.revokeAgent(agentId, developer.id, new Date())))
      throw new NotFoundException('Agent was not found.');
    this.gateway.disconnectAgent(agentId);
    return { revoked: true };
  }
}

function requireDeveloper(user: PairDockIdentity | undefined): PairDockIdentity {
  if (user?.kind !== 'developer') throw new ForbiddenException('Only a signed-in developer can pair or manage agents.');
  return user;
}

function formatUserCode(userCode: string): string {
  return `${userCode.slice(0, 4)}-${userCode.slice(4)}`;
}
