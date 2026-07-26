import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AttachmentPurpose, AttachmentVisibility, SessionAttachment } from '@pairdock/domain';
import { ATTACHMENTS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { AttachmentsRepository } from '../persistence/ports/attachments.repository.js';
import { ATTACHMENT_STORAGE, type AttachmentObject, type AttachmentStoragePort } from './attachment-storage.port.js';
import { type UploadedScreenshot, validateScreenshots } from './screenshot-validation.js';

interface CreateSessionAttachmentsInput {
  sessionId: string;
  createdByUserId: string;
  purpose: AttachmentPurpose;
  visibility: AttachmentVisibility;
  files: UploadedScreenshot[] | undefined;
}

@Injectable()
export class SessionAttachmentsService {
  private readonly logger = new Logger(SessionAttachmentsService.name);

  constructor(
    @Inject(ATTACHMENTS_REPOSITORY)
    private readonly attachmentsRepository: AttachmentsRepository,
    @Inject(ATTACHMENT_STORAGE)
    private readonly storage: AttachmentStoragePort,
  ) {}

  async create(input: CreateSessionAttachmentsInput): Promise<SessionAttachment[]> {
    const files = validateScreenshots(input.files);
    const created: SessionAttachment[] = [];

    try {
      for (const file of files) {
        const id = randomUUID();
        const objectKey = `sessions/${input.sessionId}/${input.purpose}/${id}.${file.extension}`;
        await this.storage.put({
          visibility: input.visibility,
          objectKey,
          body: file.buffer,
          mimeType: file.mimeType,
        });

        try {
          created.push(
            await this.attachmentsRepository.create({
              id,
              sessionId: input.sessionId,
              createdByUserId: input.createdByUserId,
              purpose: input.purpose,
              visibility: input.visibility,
              objectKey,
              originalName: file.originalName,
              mimeType: file.mimeType,
              byteSize: file.size,
            }),
          );
        } catch (error) {
          await this.storage.delete(input.visibility, objectKey);
          throw error;
        }
      }
      return created;
    } catch (error) {
      await this.remove(created);
      throw error;
    }
  }

  async find(id: string): Promise<SessionAttachment> {
    const attachment = await this.attachmentsRepository.findById(id);
    if (!attachment) {
      throw new NotFoundException(`Attachment ${id} was not found.`);
    }
    return attachment;
  }

  async readObject(attachment: SessionAttachment): Promise<AttachmentObject> {
    return this.storage.read(attachment.visibility, attachment.objectKey);
  }

  publicUrl(attachment: SessionAttachment): string {
    return this.storage.publicUrl(attachment.id, attachment.objectKey);
  }

  async remove(attachments: SessionAttachment[]): Promise<void> {
    const results = await Promise.allSettled(
      attachments.map((attachment) => this.storage.delete(attachment.visibility, attachment.objectKey)),
    );
    const deletedIds: string[] = [];

    results.forEach((result, index) => {
      const attachment = attachments[index];
      if (!attachment) {
        return;
      }

      if (result.status === 'fulfilled') {
        deletedIds.push(attachment.id);
        return;
      }

      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      this.logger.error(`Attachment ${attachment.id} cleanup failed; metadata was retained. ${reason}`);
    });

    if (deletedIds.length > 0) {
      await this.attachmentsRepository.deleteByIds(deletedIds);
    }
  }
}
