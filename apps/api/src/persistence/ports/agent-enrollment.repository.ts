export interface AgentPairingRecord {
  id: string;
  deviceCodeHash: string;
  userCode: string;
  deviceName: string;
  expiresAt: Date;
  ownerUserId: string | null;
  approvedAt: Date | null;
  claimedAt: Date | null;
}

export interface AgentCredentialRecord {
  agentId: string;
  ownerUserId: string;
  projectKeyPrefix: string;
  revokedAt: Date | null;
}

export interface EnrolledAgentRecord extends AgentCredentialRecord {
  deviceName: string;
  pairedAt: Date;
  lastSeenAt: Date;
}

export interface ClaimAgentPairingInput {
  deviceCodeHash: string;
  credentialHash: string;
  agentId: string;
  projectKeyPrefix: string;
  now: Date;
}

export type ClaimAgentPairingResult =
  | { status: 'pending' }
  | { status: 'unavailable' }
  | { status: 'paired'; ownerName: string };

export interface AgentEnrollmentRepository {
  createPairing(input: {
    deviceCodeHash: string;
    userCode: string;
    deviceName: string;
    expiresAt: Date;
  }): Promise<void>;
  findPairing(userCode: string): Promise<AgentPairingRecord | null>;
  findPairingByDeviceCodeHash(deviceCodeHash: string): Promise<AgentPairingRecord | null>;
  approvePairing(userCode: string, ownerUserId: string, now: Date): Promise<boolean>;
  claimPairing(input: ClaimAgentPairingInput): Promise<ClaimAgentPairingResult>;
  findCredentialByHash(credentialHash: string): Promise<AgentCredentialRecord | null>;
  findCredentialByAgentId(agentId: string): Promise<AgentCredentialRecord | null>;
  listAgents(ownerUserId: string): Promise<EnrolledAgentRecord[]>;
  revokeAgent(agentId: string, ownerUserId: string, now: Date): Promise<boolean>;
}
