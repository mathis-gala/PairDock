import { Body, Controller, Get, Inject, Param, Patch, Post, Req } from '@nestjs/common';
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

  @Get('shared/sessions')
  @RequireAuth()
  listSharedSessionHistory(@Req() request: AuthenticatedRequest) {
    return this.projectsService.listSharedSessionHistoryResponse(request.user);
  }

  @Get('developer')
  @RequireAuth()
  listDeveloperProjects(@Req() request: AuthenticatedRequest) {
    return this.projectsService.listDeveloperProjectsResponse(request.user);
  }

  @Get('developer/setup')
  @RequireAuth()
  getDeveloperProjectSetup(@Req() request: AuthenticatedRequest) {
    return this.projectsService.getDeveloperProjectSetupResponse(request.user);
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

  @Patch(':projectId/execution-defaults')
  @RequireAuth()
  updateExecutionDefaults(
    @Param('projectId') projectId: string,
    @Body() body: unknown,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.projectsService.updateExecutionDefaultsResponse(projectId, body, request.user);
  }
}
