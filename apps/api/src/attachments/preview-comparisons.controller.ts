import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MAX_PREVIEW_CAPTURE_BYTES } from '@pairdock/shared-contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { PreviewComparisonsService } from './preview-comparisons.service.js';
import type { UploadedScreenshot } from './screenshot-validation.js';

@Controller('sessions/:sessionId/preview-comparisons')
export class PreviewComparisonsController {
  constructor(@Inject(PreviewComparisonsService) private readonly comparisons: PreviewComparisonsService) {}

  @Get()
  @RequireSessionAccess()
  list(@Param('sessionId') sessionId: string, @Req() request: AuthenticatedRequest) {
    if (!request.user) throw new InternalServerErrorException('Authenticated user was not resolved.');
    return this.comparisons.list(sessionId);
  }

  @Post()
  @RequireSessionAccess()
  @UseInterceptors(
    FileInterceptor('screenshot', {
      limits: { fileSize: MAX_PREVIEW_CAPTURE_BYTES, files: 1, fields: 1, fieldSize: 4096 },
    }),
  )
  create(
    @Param('sessionId') sessionId: string,
    @Req() request: AuthenticatedRequest,
    @Body() body: { metadata?: unknown } | undefined,
    @UploadedFile() screenshot: UploadedScreenshot | undefined,
  ) {
    if (!request.user) throw new InternalServerErrorException('Authenticated user was not resolved.');
    let metadata: unknown;
    try {
      if (typeof body?.metadata !== 'string') throw new Error('missing metadata');
      metadata = JSON.parse(body.metadata);
    } catch {
      throw new BadRequestException('Comparison metadata must be valid JSON.');
    }
    return this.comparisons.create(sessionId, request.user.id, metadata, screenshot);
  }
}
