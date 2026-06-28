import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthenticatedUserGuard } from './authenticated-user.guard.js';

export function RequireAuth() {
  return applyDecorators(UseGuards(AuthenticatedUserGuard));
}
