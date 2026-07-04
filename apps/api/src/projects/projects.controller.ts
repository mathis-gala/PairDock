import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
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

  @Get('developer')
  @RequireAuth()
  listDeveloperProjects(@Req() request: AuthenticatedRequest) {
    return this.projectsService.listDeveloperProjectsResponse(request.user);
  }

  @Post()
  @RequireAuth()
  createDeveloperProject(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    return this.projectsService.createDeveloperProjectResponse(body, request.user);
  }

  @Post(':projectId/members')
  @RequireAuth()
  shareDeveloperProject(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.shareDeveloperProjectResponse(projectId, body, request.user);
  }
}
