import type { AttachmentVisibility } from '@pairdock/domain';

export interface AttachmentObject {
  body: Buffer;
  mimeType: string;
}

export interface PutAttachmentObjectInput extends AttachmentObject {
  objectKey: string;
  visibility: AttachmentVisibility;
}

export interface AttachmentStoragePort {
  delete(visibility: AttachmentVisibility, objectKey: string): Promise<void>;
  publicUrl(attachmentId: string, objectKey: string): string;
  put(input: PutAttachmentObjectInput): Promise<void>;
  read(visibility: AttachmentVisibility, objectKey: string): Promise<AttachmentObject>;
}

export const ATTACHMENT_STORAGE = Symbol('ATTACHMENT_STORAGE');
