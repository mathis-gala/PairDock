import { Controller, Get, Inject, InternalServerErrorException, Req } from '@nestjs/common';
import type { PairDockIdentity } from '@pairdock/domain';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { ProjectsService } from './projects.service.js';

@Controller('projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get('shared')
  @RequireAuth()
  listSharedProjects(@Req() request: AuthenticatedRequest) {
    return this.projectsService.listSharedProjects(this.requireUser(request.user));
  }

  private requireUser(user: PairDockIdentity | undefined): PairDockIdentity {
    if (!user) {
      throw new InternalServerErrorException('Authenticated user was not resolved.');
    }

    return user;
  }
}
