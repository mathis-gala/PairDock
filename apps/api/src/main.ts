import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? '3000');
  const frontendOrigin = new URL(process.env.FRONTEND_URL ?? 'http://localhost:5173').origin;

  app.enableCors({
    credentials: true,
    origin: frontendOrigin,
  });

  await app.listen(port);
  console.log(`PairDock API listening on port ${port}.`);
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start PairDock API.', error);
  process.exitCode = 1;
});
