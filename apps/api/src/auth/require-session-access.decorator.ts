import { applyDecorators, UseGuards } from '@nestjs/common';
import { SessionAccessGuard } from './session-access.guard.js';

export function RequireSessionAccess() {
  return applyDecorators(UseGuards(SessionAccessGuard));
}
