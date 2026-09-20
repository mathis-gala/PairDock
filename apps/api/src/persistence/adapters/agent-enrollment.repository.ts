import { Inject, Injectable } from '@nestjs/common';
import { AGENT_PROTOCOL_VERSION } from '@pairdock/shared-contracts';
import { DatabaseClient } from '../client.js';
import type {
  AgentCredentialRecord,
  AgentEnrollmentRepository,
  AgentPairingRecord,
  ClaimAgentPairingInput,
  ClaimAgentPairingResult,
  EnrolledAgentRecord,
} from '../ports/agent-enrollment.repository.js';

@Injectable()
export class AgentEnrollmentRepositoryAdapter implements AgentEnrollmentRepository {
  constructor(@Inject(DatabaseClient) private readonly database: DatabaseClient) {}

  async createPairing(input: {
    deviceCodeHash: string;
    userCode: string;
    deviceName: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.database.agentPairing.create({ data: input });
  }

  findPairing(userCode: string): Promise<AgentPairingRecord | null> {
    return this.database.agentPairing.findUnique({ where: { userCode } });
  }

  findPairingByDeviceCodeHash(deviceCodeHash: string): Promise<AgentPairingRecord | null> {
    return this.database.agentPairing.findUnique({ where: { deviceCodeHash } });
  }

  async approvePairing(userCode: string, ownerUserId: string, now: Date): Promise<boolean> {
    const result = await this.database.agentPairing.updateMany({
      where: { userCode, approvedAt: null, claimedAt: null, expiresAt: { gt: now } },
      data: { ownerUserId, approvedAt: now },
    });
    return result.count === 1;
  }

  claimPairing(input: ClaimAgentPairingInput): Promise<ClaimAgentPairingResult> {
    return this.database.$transaction(async (transaction) => {
      const pairing = await transaction.agentPairing.findUnique({
        where: { deviceCodeHash: input.deviceCodeHash },
        include: { ownerUser: true },
      });
      if (!pairing || pairing.expiresAt <= input.now || pairing.claimedAt) return { status: 'unavailable' };
      if (!pairing.ownerUser || !pairing.approvedAt) return { status: 'pending' };

      const consumed = await transaction.agentPairing.updateMany({
        where: { id: pairing.id, claimedAt: null, expiresAt: { gt: input.now } },
        data: { claimedAt: input.now },
      });
      if (consumed.count !== 1) return { status: 'unavailable' };

      await transaction.agentRegistration.create({
        data: {
          agentId: input.agentId,
          ownerUserId: pairing.ownerUser.id,
          displayName: pairing.deviceName,
          credentialHash: input.credentialHash,
          projectKeyPrefix: input.projectKeyPrefix,
          pairedAt: input.now,
          disconnectedAt: input.now,
          protocolVersion: AGENT_PROTOCOL_VERSION,
        },
      });
      return { status: 'paired', ownerName: pairing.ownerUser.displayName ?? pairing.ownerUser.email };
    });
  }

  async findCredentialByHash(credentialHash: string): Promise<AgentCredentialRecord | null> {
    return credentialRecord(await this.database.agentRegistration.findUnique({ where: { credentialHash } }));
  }

  async findCredentialByAgentId(agentId: string): Promise<AgentCredentialRecord | null> {
    return credentialRecord(await this.database.agentRegistration.findUnique({ where: { agentId } }));
  }

  async listAgents(ownerUserId: string): Promise<EnrolledAgentRecord[]> {
    const agents = await this.database.agentRegistration.findMany({
      where: { ownerUserId, pairedAt: { not: null } },
      orderBy: { pairedAt: 'desc' },
      take: 100,
    });
    return agents.flatMap((agent) => {
      const credential = credentialRecord(agent);
      return credential && agent.pairedAt
        ? [
            {
              ...credential,
              deviceName: agent.displayName ?? agent.agentId,
              pairedAt: agent.pairedAt,
              lastSeenAt: agent.lastSeenAt,
            },
          ]
        : [];
    });
  }

  async revokeAgent(agentId: string, ownerUserId: string, now: Date): Promise<boolean> {
    const result = await this.database.agentRegistration.updateMany({
      where: { agentId, ownerUserId, pairedAt: { not: null } },
      data: { revokedAt: now, disconnectedAt: now },
    });
    return result.count === 1;
  }
}

function credentialRecord(
  record: {
    agentId: string;
    ownerUserId: string | null;
    projectKeyPrefix: string | null;
    revokedAt: Date | null;
  } | null,
): AgentCredentialRecord | null {
  if (!record?.ownerUserId || !record.projectKeyPrefix) return null;
  return {
    agentId: record.agentId,
    ownerUserId: record.ownerUserId,
    projectKeyPrefix: record.projectKeyPrefix,
    revokedAt: record.revokedAt,
  };
}
