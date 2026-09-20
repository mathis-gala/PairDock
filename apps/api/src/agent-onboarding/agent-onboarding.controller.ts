import { BadRequestException, Body, Controller, Delete, Get, Header, Inject, Param, Post, Req } from '@nestjs/common';
import {
  agentPairingUserCodeSchema,
  approveAgentPairingInputSchema,
  claimAgentPairingInputSchema,
  startAgentPairingInputSchema,
} from '@pairdock/shared-contracts';
import type { AuthenticatedRequest } from '../auth/authenticated-request.js';
import { RequireAuth } from '../auth/require-auth.decorator.js';
import { AgentOnboardingService } from './agent-onboarding.service.js';
import { AgentPairingClientAddress } from './agent-pairing-client-address.js';

interface PairingRequest extends AuthenticatedRequest {
  socket: { remoteAddress?: string };
}

@Controller()
export class AgentOnboardingController {
  constructor(
    @Inject(AgentOnboardingService) private readonly onboarding: AgentOnboardingService,
    @Inject(AgentPairingClientAddress) private readonly clientAddress: AgentPairingClientAddress,
  ) {}

  @Post('agent-pairings')
  @Header('Cache-Control', 'no-store')
  start(@Body() body: unknown, @Req() request: PairingRequest) {
    const input = startAgentPairingInputSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Provide a device name of at most 100 characters.');
    return this.onboarding.start(
      input.data.deviceName,
      this.clientAddress.resolve(request.socket.remoteAddress, request.headers['x-real-ip']),
    );
  }

  @Post('agent-pairings/claim')
  @Header('Cache-Control', 'no-store')
  claim(@Body() body: unknown, @Req() request: PairingRequest) {
    const input = claimAgentPairingInputSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Invalid device code.');
    return this.onboarding.claim(
      input.data.deviceCode,
      this.clientAddress.resolve(request.socket.remoteAddress, request.headers['x-real-ip']),
    );
  }

  @Get('developer/agent-pairings/:userCode')
  @RequireAuth()
  @Header('Cache-Control', 'no-store')
  details(@Param('userCode') userCode: string, @Req() request: AuthenticatedRequest) {
    const code = agentPairingUserCodeSchema.safeParse(userCode);
    if (!code.success) throw new BadRequestException('Invalid pairing code.');
    return this.onboarding.details(code.data, request.user);
  }

  @Post('developer/agent-pairings/approve')
  @RequireAuth()
  @Header('Cache-Control', 'no-store')
  approve(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const input = approveAgentPairingInputSchema.safeParse(body);
    if (!input.success) throw new BadRequestException('Invalid pairing code.');
    return this.onboarding.approve(input.data.userCode, request.user);
  }

  @Get('developer/agents')
  @RequireAuth()
  @Header('Cache-Control', 'no-store')
  list(@Req() request: AuthenticatedRequest) {
    return this.onboarding.list(request.user);
  }

  @Delete('developer/agents/:agentId')
  @RequireAuth()
  @Header('Cache-Control', 'no-store')
  revoke(@Param('agentId') agentId: string, @Req() request: AuthenticatedRequest) {
    return this.onboarding.revoke(agentId, request.user);
  }
}
