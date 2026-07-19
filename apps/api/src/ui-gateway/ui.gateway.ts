import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import {
  type AgentEventEnvelope,
  uiSessionEventName,
  uiSessionSubscribedEventName,
  uiSessionSubscribeEventName,
  uiSessionSubscriptionSchema,
} from '@pairdock/shared-contracts';
import type { Server, Socket } from 'socket.io';
import { AuthTokenService } from '../auth/auth-token.service.js';
import { InvitationsService } from '../invitations/invitations.service.js';

@Injectable()
@WebSocketGateway({
  namespace: '/ui',
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' },
  maxHttpBufferSize: 64 * 1024,
})
export class UiGateway {
  @WebSocketServer()
  private server!: Server;

  constructor(
    @Inject(AuthTokenService)
    private readonly authTokenService: AuthTokenService,
    @Inject(InvitationsService)
    private readonly invitationsService: InvitationsService,
  ) {}

  @SubscribeMessage(uiSessionSubscribeEventName)
  async subscribeToSession(@MessageBody() payload: unknown, @ConnectedSocket() client: Socket) {
    const subscription = uiSessionSubscriptionSchema.parse(payload);
    const user = this.authTokenService.verify(this.extractAuthToken(client));
    const membership = await this.invitationsService.findMembership(subscription.sessionId, user.id);

    if (!membership) {
      throw new ForbiddenException('You are not a member of this session.');
    }

    await client.join(this.roomName(subscription.sessionId));
    client.emit(uiSessionSubscribedEventName, subscription);
    return subscription;
  }

  publishSessionEvent(sessionId: string, event: AgentEventEnvelope): void {
    this.server.to(this.roomName(sessionId)).emit(uiSessionEventName, event);
  }

  private roomName(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private extractAuthToken(client: Socket): string {
    const authToken = this.extractAuthTokenFromHandshake(client.handshake.auth);

    if (authToken) {
      return authToken;
    }

    return this.extractBearerToken(client.handshake.headers.authorization);
  }

  private extractAuthTokenFromHandshake(auth: Socket['handshake']['auth']): string | null {
    if (!auth || typeof auth !== 'object') {
      return null;
    }

    if ('token' in auth && typeof auth.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    if ('authorization' in auth && typeof auth.authorization === 'string') {
      return this.extractBearerToken(auth.authorization);
    }

    return null;
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
