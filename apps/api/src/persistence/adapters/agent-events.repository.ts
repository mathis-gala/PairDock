import { Inject, Injectable } from '@nestjs/common';
import type { AgentEventRecord } from '@pairdock/domain';
import type { DatabaseExecutor } from '../client.js';
import { DatabaseClient } from '../client.js';
import type { AgentEventsRepository, CreateAgentEventInput } from '../ports/agent-events.repository.js';
import { serializeJsonValue } from './json-parsers.js';
import { mapAgentEvent } from './mappers.js';

@Injectable()
export class AgentEventsRepositoryAdapter implements AgentEventsRepository {
  constructor(@Inject(DatabaseClient) private readonly prisma: DatabaseExecutor) {}

  async create(input: CreateAgentEventInput): Promise<AgentEventRecord> {
    const record = await this.prisma.agentEvent.create({
      data: {
        sessionId: input.sessionId ?? null,
        agentId: input.agentId ?? null,
        type: input.type,
        payload: serializeJsonValue(input.payload),
      },
    });

    return mapAgentEvent(record);
  }

  async listBySessionId(sessionId: string): Promise<AgentEventRecord[]> {
    const records = await this.prisma.agentEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return records.map(mapAgentEvent);
  }
}
