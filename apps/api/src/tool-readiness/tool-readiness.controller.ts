import { Controller, Get, HttpCode, HttpStatus, Inject, Param, Post, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { ToolReadinessService } from './tool-readiness.service.js';

@Controller('tool-readiness')
export class ToolReadinessController {
  constructor(@Inject(ToolReadinessService) private readonly toolReadinessService: ToolReadinessService) {}

  @Get('projects/:projectId')
  @RequireAuth()
  getProjectReadiness(@Param('projectId') projectId: string, @Req() request: AuthenticatedRequest) {
    return this.toolReadinessService.getProjectReadinessResponse(projectId, request.user);
  }

  @Post('projects/:projectId/check')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequireAuth()
  requestProjectReadinessCheck(@Param('projectId') projectId: string, @Req() request: AuthenticatedRequest) {
    return this.toolReadinessService.requestProjectReadinessCheckResponse(projectId, request.user);
  }
}
