import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

@Injectable()
export class AuthenticatedUserGuard implements CanActivate {
  constructor(@Inject(AuthTokenService) private readonly authTokenService: AuthTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearerToken = this.extractBearerToken(request.headers.authorization);

    request.user = this.authTokenService.verify(bearerToken);

    return true;
  }

  private extractBearerToken(authorizationHeader: string | string[] | undefined): string {
    const headerValue = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;

    if (!headerValue) {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    const [scheme, token] = headerValue.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Expected a Bearer token.');
    }

    return token;
  }
}
