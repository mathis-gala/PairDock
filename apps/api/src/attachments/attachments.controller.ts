import { Controller, Get, Inject, NotFoundException, Param, Req, Res, UnauthorizedException } from '@nestjs/common';
import { AgentAuthenticationService } from '../agent-gateway/agent-authentication.service.js';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireSessionAccess } from '../auth/require-session-access.decorator.js';
import { PROJECTS_REPOSITORY, SESSIONS_REPOSITORY } from '../persistence/persistence.tokens.js';
import type { ProjectsRepository } from '../persistence/ports/projects.repository.js';
import type { SessionsRepository } from '../persistence/ports/sessions.repository.js';
import { SessionAttachmentsService } from './session-attachments.service.js';

interface BinaryResponse {
  send(body: Buffer): void;
  setHeader(name: string, value: number | string): void;
}

@Controller()
export class AttachmentsController {
  constructor(
    @Inject(SessionAttachmentsService)
    private readonly attachments: SessionAttachmentsService,
    @Inject(AgentAuthenticationService)
    private readonly agentAuthentication: AgentAuthenticationService,
    @Inject(SESSIONS_REPOSITORY)
    private readonly sessionsRepository: SessionsRepository,
    @Inject(PROJECTS_REPOSITORY)
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  @Get('sessions/:sessionId/attachments/:attachmentId')
  @RequireSessionAccess()
  async readSessionAttachment(
    @Param('sessionId') sessionId: string,
    @Param('attachmentId') attachmentId: string,
    @Res() response: BinaryResponse,
  ) {
    const attachment = await this.attachments.find(attachmentId);
    if (attachment.sessionId !== sessionId || attachment.visibility !== 'private') {
      throw new NotFoundException(`Attachment ${attachmentId} was not found.`);
    }
    const object = await this.attachments.readObject(attachment);
    sendAttachment(response, object.body, object.mimeType, 'private, max-age=300');
  }

  @Get('agent/attachments/:attachmentId')
  async readAgentAttachment(
    @Param('attachmentId') attachmentId: string,
    @Req() request: AuthenticatedRequest,
    @Res() response: BinaryResponse,
  ) {
    const principal = this.agentAuthentication.authenticate(request.headers.authorization);
    const attachment = await this.attachments.find(attachmentId);
    const session = await this.sessionsRepository.findById(attachment.sessionId);
    const project = session ? await this.projectsRepository.findById(session.projectId) : null;

    if (!project || (principal && !principal.projectKeys.includes(project.agentProjectKey))) {
      throw new UnauthorizedException('Agent is not authorized to download this attachment.');
    }
    const object = await this.attachments.readObject(attachment);
    sendAttachment(response, object.body, object.mimeType, 'private, no-store');
  }

  @Get('public/attachments/:attachmentId')
  async readPublicAttachment(@Param('attachmentId') attachmentId: string, @Res() response: BinaryResponse) {
    const attachment = await this.attachments.find(attachmentId);
    if (attachment.visibility !== 'public') {
      throw new NotFoundException(`Attachment ${attachmentId} was not found.`);
    }
    const object = await this.attachments.readObject(attachment);
    sendAttachment(response, object.body, object.mimeType, 'public, max-age=31536000, immutable');
  }
}

function sendAttachment(response: BinaryResponse, body: Buffer, mimeType: string, cacheControl: string): void {
  response.setHeader('Content-Type', mimeType);
  response.setHeader('Content-Length', body.byteLength);
  response.setHeader('Cache-Control', cacheControl);
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Disposition', 'inline');
  response.send(body);
}
