import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { type AuthResult, AuthService } from './auth.service.js';

interface AuthCallbackBody {
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('developer/start')
  @Redirect()
  startDeveloperAuth(): { url: string } {
    return { url: this.authService.getDeveloperStartUrl() };
  }

  @Get('developer/callback')
  @Redirect()
  async finishDeveloperAuth(
    @Query('code') code?: string,
    @Query('installation_id') installationId?: string,
  ): Promise<{ url: string }> {
    if (!code) {
      throw new BadRequestException('GitHub OAuth code is required.');
    }

    return { url: await this.authService.authenticateDeveloperRedirectUrl(code, installationId) };
  }

  @Get('pm/start')
  @Redirect()
  startPmAuth(): { url: string } {
    return { url: this.authService.getPmStartUrl() };
  }

  @Get('pm/callback')
  @Redirect()
  async finishPmAuth(@Query('code') code?: string): Promise<{ url: string }> {
    if (!code) {
      throw new BadRequestException('Slack OAuth code is required.');
    }

    return { url: await this.authService.authenticatePmRedirectUrl(code) };
  }

  @Post('developer/callback')
  @HttpCode(HttpStatus.OK)
  authenticateDeveloper(@Body() body: AuthCallbackBody): Promise<AuthResult> {
    return this.authService.authenticateDeveloper(body.accessToken);
  }

  @Post('pm/callback')
  @HttpCode(HttpStatus.OK)
  authenticatePm(@Body() body: AuthCallbackBody): Promise<AuthResult> {
    return this.authService.authenticatePm(body.accessToken);
  }
}
