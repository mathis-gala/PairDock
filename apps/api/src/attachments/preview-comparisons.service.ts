import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AgentEventRecord, SessionAttachment } from '@pairdock/domain';
import {
  isPromptableSessionStatus,
  MAX_PREVIEW_COMPARISON_CAPTURES,
  MAX_PREVIEW_COMPARISONS,
  PREVIEW_COMPARISON_EVENT,
  type PreviewComparison,
  type PreviewComparisonCapture,
  type PreviewComparisonCaptureEvent,
  type PreviewComparisonInput,
  previewComparisonCaptureEventSchema,
  previewComparisonInputSchema,
} from '@pairdock/shared-contracts';
import {
  AGENT_EVENTS_REPOSITORY,
  ATTACHMENTS_REPOSITORY,
  PERSISTENCE_UNIT_OF_WORK,
  SESSIONS_REPOSITORY,
} from '../persistence/persistence.tokens.js';
import type { AgentEventsRepository } from '../persistence/ports/agent-events.repository.js';
import type { AttachmentsRepository } from '../persistence/ports/attachments.repository.js';
import type { PersistenceRepositories, PersistenceUnitOfWork } from '../persistence/ports/persistence-unit-of-work.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { validatePreviewCapture } from './preview-capture-validation.js';
import type { UploadedScreenshot } from './screenshot-validation.js';
import { SessionAttachmentsService } from './session-attachments.service.js';

type ComparisonRepositories = Pick<PersistenceRepositories, 'sessions' | 'agentEvents' | 'attachments'>;

@Injectable()
export class PreviewComparisonsService {
  constructor(
    @Inject(SESSIONS_REPOSITORY) private readonly sessions: SessionsRepository,
    @Inject(AGENT_EVENTS_REPOSITORY) private readonly events: AgentEventsRepository,
    @Inject(ATTACHMENTS_REPOSITORY) private readonly attachmentRecords: AttachmentsRepository,
    @Inject(PERSISTENCE_UNIT_OF_WORK) private readonly unitOfWork: PersistenceUnitOfWork,
    @Inject(SessionAttachmentsService) private readonly attachments: SessionAttachmentsService,
  ) {}

  async list(sessionId: string): Promise<PreviewComparison[]> {
    return this.readComparisons(sessionId, await this.events.listBySessionId(sessionId), this.attachmentRecords);
  }

  async create(
    sessionId: string,
    userId: string,
    metadata: unknown,
    screenshot: UploadedScreenshot | undefined,
  ): Promise<PreviewComparison> {
    const parsed = previewComparisonInputSchema.safeParse(metadata);
    if (!parsed.success) throw new BadRequestException('Valid comparison stage, page URL, and viewport are required.');
    const input = { ...parsed.data, pageUrl: new URL(parsed.data.pageUrl).href };
    const repositories = { sessions: this.sessions, agentEvents: this.events, attachments: this.attachmentRecords };
    await this.assertCaptureAllowed(sessionId, input, null, repositories);
    const image = await validatePreviewCapture(screenshot);

    const uploaded = await this.attachments.create({
      sessionId,
      createdByUserId: userId,
      purpose: 'preview_comparison',
      visibility: 'private',
      files: screenshot ? [screenshot] : [],
    });
    try {
      return await this.unitOfWork.execute(
        async (transaction) => {
          // Uploads stay outside the transaction. The row lock serializes the final state/count check and append.
          const records = await this.assertCaptureAllowed(sessionId, input, image, transaction);
          const attachment = uploaded[0];
          if (!attachment) throw new BadRequestException('A PNG screenshot is required.');
          const comparisonId = input.stage === 'before' ? randomUUID() : input.comparisonId;
          const payload: PreviewComparisonCaptureEvent = {
            comparisonId,
            stage: input.stage,
            pageUrl: input.pageUrl,
            viewport: input.viewport,
            image,
            attachmentId: attachment.id,
          };
          const event = await transaction.agentEvents.create({
            sessionId,
            type: PREVIEW_COMPARISON_EVENT,
            // Transaction timestamps can predate lock acquisition; this sequence defines append order.
            payload: { ...payload, captureSequence: records.length + 1 },
          });
          const comparisons = await this.readComparisons(
            sessionId,
            [...records, event].filter((record) => record.payload.comparisonId === comparisonId),
            transaction.attachments,
          );
          const result = comparisons.find((comparison) => comparison.id === comparisonId);
          if (!result) throw new ConflictException('The comparison capture could not be saved.');
          return result;
        },
        { lockSessionId: sessionId },
      );
    } catch (error) {
      await this.attachments.remove(uploaded);
      throw error;
    }
  }

  private async assertCaptureAllowed(
    sessionId: string,
    input: PreviewComparisonInput,
    image: PreviewComparisonCapture['image'] | null,
    repositories: ComparisonRepositories,
  ) {
    const session = await repositories.sessions.findById(sessionId);
    if (!session) throw new NotFoundException('Session was not found.');
    if (!isPromptableSessionStatus(session.status))
      throw new ConflictException('The session must be idle before importing comparison captures.');
    if (
      session.previewUrl &&
      URL.canParse(session.previewUrl) &&
      new URL(session.previewUrl).origin !== new URL(input.pageUrl).origin
    ) {
      throw new BadRequestException('The capture page must belong to this session preview.');
    }
    const records = (await repositories.agentEvents.listBySessionId(sessionId)).filter(
      (record) => record.type === PREVIEW_COMPARISON_EVENT,
    );
    if (records.length >= MAX_PREVIEW_COMPARISON_CAPTURES)
      throw new ConflictException('This session has reached its comparison capture limit.');
    const captures = records.flatMap((record) => {
      const parsed = previewComparisonCaptureEventSchema.safeParse(record.payload);
      return parsed.success && !record.agentId ? [parsed.data] : [];
    });
    if (input.stage === 'before') {
      if (captures.filter((capture) => capture.stage === 'before').length >= MAX_PREVIEW_COMPARISONS) {
        throw new ConflictException('This session has reached its comparison limit.');
      }
    } else {
      const before = captures.find(
        (capture) => capture.comparisonId === input.comparisonId && capture.stage === 'before',
      );
      if (!before) throw new NotFoundException('The before capture was not found in this session.');
      if (!sameContext(before, { ...input, image: image ?? before.image })) {
        throw new BadRequestException('Before and after must have the same page URL, viewport, and PNG dimensions.');
      }
    }
    return records;
  }

  private async readComparisons(
    sessionId: string,
    records: AgentEventRecord[],
    attachments: AttachmentsRepository,
  ): Promise<PreviewComparison[]> {
    const captures = records
      .flatMap((record) => {
        if (record.type !== PREVIEW_COMPARISON_EVENT || record.agentId || record.sessionId !== sessionId) return [];
        const parsed = previewComparisonCaptureEventSchema.safeParse(record.payload);
        const sequence = record.payload.captureSequence;
        return parsed.success && typeof sequence === 'number' && Number.isSafeInteger(sequence) && sequence > 0
          ? [{ ...parsed.data, sequence, createdAt: record.createdAt }]
          : [];
      })
      .sort((left, right) => left.sequence - right.sequence);
    const groups = new Map<string, { before: (typeof captures)[number]; after: (typeof captures)[number] | null }>();
    for (const capture of captures) {
      const group = groups.get(capture.comparisonId);
      if (capture.stage === 'before' && !group) {
        groups.set(capture.comparisonId, { before: capture, after: null });
      } else if (capture.stage === 'after' && group && sameContext(group.before, capture)) {
        group.after = capture;
      }
    }
    const attachmentIds = [...groups.values()].flatMap((group) =>
      group.after ? [group.before.attachmentId, group.after.attachmentId] : [group.before.attachmentId],
    );
    const attachmentById = new Map(
      (await attachments.findByIds([...new Set(attachmentIds)])).map((attachment) => [attachment.id, attachment]),
    );
    const comparisons: PreviewComparison[] = [];
    for (const [id, group] of groups) {
      const before = this.readCapture(sessionId, group.before, attachmentById);
      if (!before) continue;
      comparisons.push({
        id,
        pageUrl: group.before.pageUrl,
        viewport: group.before.viewport,
        before,
        after: group.after ? this.readCapture(sessionId, group.after, attachmentById) : null,
      });
    }
    return comparisons;
  }

  private readCapture(
    sessionId: string,
    capture: PreviewComparisonCaptureEvent & { createdAt: Date },
    attachments: ReadonlyMap<string, SessionAttachment>,
  ) {
    const attachment = attachments.get(capture.attachmentId);
    if (
      !attachment ||
      attachment.sessionId !== sessionId ||
      attachment.purpose !== 'preview_comparison' ||
      attachment.visibility !== 'private' ||
      attachment.mimeType !== 'image/png'
    )
      return null;
    return toCaptureView(attachment, capture.image, capture.createdAt);
  }
}

function sameContext(
  left: Pick<PreviewComparisonCaptureEvent, 'pageUrl' | 'viewport' | 'image'>,
  right: Pick<PreviewComparisonCaptureEvent, 'pageUrl' | 'viewport' | 'image'>,
) {
  return (
    left.pageUrl === right.pageUrl &&
    left.viewport.width === right.viewport.width &&
    left.viewport.height === right.viewport.height &&
    left.image.width === right.image.width &&
    left.image.height === right.image.height
  );
}

function toCaptureView(
  attachment: SessionAttachment,
  image: PreviewComparisonCapture['image'],
  createdAt: Date,
): PreviewComparisonCapture {
  return {
    attachment: {
      id: attachment.id,
      fileName: attachment.originalName,
      mimeType: 'image/png',
      byteSize: attachment.byteSize,
    },
    image,
    createdAt: createdAt.toISOString(),
  };
}
