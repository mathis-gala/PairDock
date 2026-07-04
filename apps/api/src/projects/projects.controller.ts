import { Controller, Get, Inject, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get('shared')
  @RequireAuth()
  listSharedProjects(@Req() request: AuthenticatedRequest) {
    return this.projectsService.listSharedProjectsResponse(request.user);
  }
}
