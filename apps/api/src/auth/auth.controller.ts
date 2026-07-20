import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Redirect,
  Res,
} from '@nestjs/common';
import { type AuthResult, AuthService, type DevelopmentAuthRole } from './auth.service.js';

interface AuthCallbackBody {
  accessToken: string;
}

interface DevelopmentAuthBody {
  role?: unknown;
}

interface HeaderResponse {
  setHeader(name: string, value: string | string[]): void;
}

const GITHUB_INSTALLATION_STATE_COOKIE = 'pairdock_github_installation_state';
const GITHUB_AUTHORIZATION_STATE_COOKIE = 'pairdock_github_authorization_state';
const SLACK_AUTHORIZATION_STATE_COOKIE = 'pairdock_slack_authorization_state';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('providers')
  getAuthProviders(): { developmentAuthEnabled: boolean } {
    return this.authService.getAuthProviders();
  }

  @Post('development/login')
  @HttpCode(HttpStatus.OK)
  authenticateDevelopment(@Body() body: DevelopmentAuthBody): Promise<AuthResult> {
    if (!isDevelopmentAuthRole(body.role)) {
      throw new BadRequestException('Development authentication role must be developer or pm.');
    }

    return this.authService.authenticateDevelopment(body.role);
  }

  @Get('developer/start')
  @Redirect()
  startDeveloperAuth(@Res({ passthrough: true }) response: HeaderResponse): { url: string } {
    const url = this.authService.getDeveloperStartUrl();
    const state = readStateFromRedirectUrl(url);
    response.setHeader('set-cookie', serializeStateCookie(GITHUB_AUTHORIZATION_STATE_COOKIE, state));

    return { url };
  }

  @Get('developer/install')
  @Redirect()
  installDeveloperApp(@Res({ passthrough: true }) response: HeaderResponse): { url: string } {
    const url = this.authService.getDeveloperInstallationUrl();
    const state = readStateFromRedirectUrl(url);
    response.setHeader('set-cookie', serializeStateCookie(GITHUB_INSTALLATION_STATE_COOKIE, state));

    return { url };
  }

  @Get('developer/setup')
  @Redirect()
  continueDeveloperAuth(
    @Query('installation_id') installationId?: string,
    @Query('state') state?: string,
    @Headers('cookie') cookieHeader?: string,
    @Res({ passthrough: true }) response?: HeaderResponse,
  ): { url: string } {
    if (!installationId || !state) {
      throw new BadRequestException('GitHub installation id and state are required.');
    }

    assertStateCookie(cookieHeader, GITHUB_INSTALLATION_STATE_COOKIE, state);
    const url = this.authService.getDeveloperAuthorizationUrl(installationId, state);
    const authorizationState = readStateFromRedirectUrl(url);
    response?.setHeader('set-cookie', [
      clearStateCookie(GITHUB_INSTALLATION_STATE_COOKIE),
      serializeStateCookie(GITHUB_AUTHORIZATION_STATE_COOKIE, authorizationState),
    ]);

    return { url };
  }

  @Get('developer/callback')
  @Redirect()
  async finishDeveloperAuth(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Headers('cookie') cookieHeader?: string,
    @Res({ passthrough: true }) response?: HeaderResponse,
  ): Promise<{ url: string }> {
    if (!code || !state) {
      throw new BadRequestException('GitHub OAuth code and state are required.');
    }

    assertStateCookie(cookieHeader, GITHUB_AUTHORIZATION_STATE_COOKIE, state);
    response?.setHeader('set-cookie', clearStateCookie(GITHUB_AUTHORIZATION_STATE_COOKIE));

    return { url: await this.authService.authenticateDeveloperRedirectUrl(code, state) };
  }

  @Get('pm/start')
  @Redirect()
  startPmAuth(@Res({ passthrough: true }) response: HeaderResponse): { url: string } {
    const url = this.authService.getPmStartUrl();
    response.setHeader(
      'set-cookie',
      serializeStateCookie(SLACK_AUTHORIZATION_STATE_COOKIE, readStateFromRedirectUrl(url), '/auth/pm'),
    );

    return { url };
  }

  @Get('pm/callback')
  @Redirect()
  async finishPmAuth(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Headers('cookie') cookieHeader?: string,
    @Res({ passthrough: true }) response?: HeaderResponse,
  ): Promise<{ url: string }> {
    if (!code || !state) {
      throw new BadRequestException('Slack OAuth code and state are required.');
    }

    assertStateCookie(cookieHeader, SLACK_AUTHORIZATION_STATE_COOKIE, state);
    response?.setHeader('set-cookie', clearStateCookie(SLACK_AUTHORIZATION_STATE_COOKIE, '/auth/pm'));

    return { url: await this.authService.authenticatePmRedirectUrl(code, state) };
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

function assertStateCookie(cookieHeader: string | undefined, name: string, expectedState: string): void {
  if (readCookie(cookieHeader, name) !== expectedState) {
    throw new BadRequestException('Invalid GitHub authentication state.');
  }
}

function readCookie(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const entry of cookieHeader.split(';')) {
    const [cookieName, ...valueParts] = entry.trim().split('=');

    if (cookieName === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

function readStateFromRedirectUrl(url: string): string {
  const state = new URL(url).searchParams.get('state');

  if (!state) {
    throw new BadRequestException('GitHub authentication state could not be created.');
  }

  return state;
}

function serializeStateCookie(name: string, state: string, path = '/auth/developer'): string {
  return `${name}=${encodeURIComponent(state)}; HttpOnly; Max-Age=600; Path=${path}; SameSite=Lax${secureCookieSuffix()}`;
}

function clearStateCookie(name: string, path = '/auth/developer'): string {
  return `${name}=; HttpOnly; Max-Age=0; Path=${path}; SameSite=Lax${secureCookieSuffix()}`;
}

function secureCookieSuffix(): string {
  return process.env.NODE_ENV === 'production' ? '; Secure' : '';
}

function isDevelopmentAuthRole(value: unknown): value is DevelopmentAuthRole {
  return value === 'developer' || value === 'pm';
}
