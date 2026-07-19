import { Inject, Injectable } from '@nestjs/common';
import type { AgentRegistration } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import { DatabaseClient } from '../client.js';
import type {
  AgentRegistrationsRepository,
  UpsertAgentRegistrationInput,
} from '../ports/agent-registrations.repository.js';
import { serializeJsonValue } from './json-parsers.js';

@Injectable()
export class AgentRegistrationsRepositoryAdapter implements AgentRegistrationsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async markConnected(input: UpsertAgentRegistrationInput): Promise<AgentRegistration> {
    const now = new Date();
    const record = await this.prisma.agentRegistration.upsert({
      where: { agentId: input.agentId },
      create: {
        agentId: input.agentId,
        displayName: input.agentId,
        protocolVersion: input.protocolVersion,
        capabilities: serializeJsonValue(input.capabilities),
        models: serializeJsonValue(input.models),
        projects: serializeJsonValue(input.projects),
        connectedAt: now,
        lastSeenAt: now,
        disconnectedAt: null,
      },
      update: {
        protocolVersion: input.protocolVersion,
        capabilities: serializeJsonValue(input.capabilities),
        models: serializeJsonValue(input.models),
        projects: serializeJsonValue(input.projects),
        connectedAt: now,
        lastSeenAt: now,
        disconnectedAt: null,
      },
    });

    return mapAgentRegistration(record);
  }

  async markDisconnected(agentId: string): Promise<AgentRegistration | null> {
    const existing = await this.prisma.agentRegistration.findUnique({ where: { agentId } });

    if (!existing) {
      return null;
    }

    const now = new Date();
    const record = await this.prisma.agentRegistration.update({
      where: { agentId },
      data: {
        lastSeenAt: now,
        disconnectedAt: now,
      },
    });

    return mapAgentRegistration(record);
  }

  async findByAgentId(agentId: string): Promise<AgentRegistration | null> {
    const record = await this.prisma.agentRegistration.findUnique({ where: { agentId } });
    return record ? mapAgentRegistration(record) : null;
  }
}

function mapAgentRegistration(record: {
  id: string;
  agentId: string;
  ownerUserId: string | null;
  displayName: string | null;
  protocolVersion: string;
  capabilities: unknown;
  models: unknown;
  projects: unknown;
  connectedAt: Date;
  lastSeenAt: Date;
  disconnectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AgentRegistration {
  return {
    id: record.id,
    agentId: record.agentId,
    ownerUserId: record.ownerUserId,
    displayName: record.displayName,
    protocolVersion: record.protocolVersion,
    capabilities: parseStringArray(record.capabilities),
    models: parseModels(record.models),
    projects: parseProjects(record.projects),
    connectedAt: record.connectedAt,
    lastSeenAt: record.lastSeenAt,
    disconnectedAt: record.disconnectedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function parseModels(value: unknown): AgentRegistration['models'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    if (typeof item.id !== 'string' || typeof item.label !== 'string' || typeof item.provider !== 'string') {
      return [];
    }

    const reasoningEfforts = Array.isArray(item.reasoningEfforts)
      ? item.reasoningEfforts.flatMap((effort) => {
          if (!isRecord(effort) || typeof effort.id !== 'string' || typeof effort.label !== 'string') {
            return [];
          }

          return [
            {
              id: effort.id,
              label: effort.label,
              ...(typeof effort.description === 'string' ? { description: effort.description } : {}),
            },
          ];
        })
      : undefined;

    return [
      {
        id: item.id,
        label: item.label,
        provider: item.provider,
        ...(reasoningEfforts ? { reasoningEfforts } : {}),
        ...(typeof item.defaultReasoningEffort === 'string'
          ? { defaultReasoningEffort: item.defaultReasoningEffort }
          : {}),
      },
    ];
  });
}

function parseProjects(value: unknown): AgentRegistration['projects'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      !isRecord(item) ||
      typeof item.key !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.repoFullName !== 'string' ||
      typeof item.pathAlias !== 'string'
    ) {
      return [];
    }

    return [
      {
        key: item.key,
        name: item.name,
        repoFullName: item.repoFullName,
        pathAlias: item.pathAlias,
        ...(typeof item.defaultBranch === 'string' ? { defaultBranch: item.defaultBranch } : {}),
        ...(Array.isArray(item.models) ? { models: parseStringArray(item.models) } : {}),
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
