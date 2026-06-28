import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InvitationsService } from '../invitations/invitations.service.js';
import { AuthTokenService } from './auth-token.service.js';
import type { AuthenticatedRequest } from './authenticated-request.js';

@Injectable()
export class SessionAccessGuard implements CanActivate {
  constructor(
    @Inject(AuthTokenService)
    private readonly authTokenService: AuthTokenService,
    @Inject(InvitationsService)
    private readonly invitationsService: InvitationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const sessionId = request.params.sessionId;

    if (!sessionId) {
      throw new ForbiddenException('Session access requires a session id.');
    }

    const authorizationHeader = request.headers.authorization;
    const bearerToken = this.extractBearerToken(authorizationHeader);
    const user = this.authTokenService.verify(bearerToken);
    const membership = await this.invitationsService.findMembership(sessionId, user.id);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this session.');
    }

    request.user = user;
    request.sessionMember = membership;
    return true;
  }

  private getRequest(context: ExecutionContext): AuthenticatedRequest {
    if (context.getType<'http' | 'ws'>() === 'ws') {
      const client = context
        .switchToWs()
        .getClient<{ handshake?: { headers?: Record<string, string | string[] | undefined> } }>();
      const data = context.switchToWs().getData<{ sessionId?: string } | undefined>();

      return {
        headers: client.handshake?.headers ?? {},
        params: { sessionId: data?.sessionId },
      };
    }

    return context.switchToHttp().getRequest<AuthenticatedRequest>();
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
