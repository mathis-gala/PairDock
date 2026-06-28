import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  getHealth() {
    return {
      service: 'pairdock-api',
      status: 'ok',
      message: 'NestJS skeleton ready',
    };
  }
}
