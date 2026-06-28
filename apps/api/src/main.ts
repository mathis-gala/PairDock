import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? '3000');

  await app.listen(port);
  console.log(`PairDock API skeleton listening on http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start PairDock API skeleton', error);
  process.exitCode = 1;
});
