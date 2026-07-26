import type { AttachmentPurpose, AttachmentVisibility, SessionAttachment } from '@pairdock/domain';

export interface CreateAttachmentInput {
  id?: string;
  sessionId: string;
  messageId?: string | null;
  createdByUserId: string;
  purpose: AttachmentPurpose;
  visibility: AttachmentVisibility;
  objectKey: string;
  originalName: string;
  mimeType: string;
  byteSize: number;
}

export interface AttachmentsRepository {
  create(input: CreateAttachmentInput): Promise<SessionAttachment>;
  deleteByIds(ids: string[]): Promise<void>;
  findById(id: string): Promise<SessionAttachment | null>;
  listByMessageIds(messageIds: string[]): Promise<SessionAttachment[]>;
  updateMessageId(ids: string[], messageId: string): Promise<void>;
}
