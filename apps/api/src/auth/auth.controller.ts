import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { type AuthResult, AuthService } from './auth.service.js';

interface AuthCallbackBody {
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

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
