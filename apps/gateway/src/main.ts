import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  process.title = 'gateway';
  const logger = new Logger('GATEWAY_SERVICE');

  const app = await NestFactory.create(GatewayModule);
  app.enableCors({
    origin: ['http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.enableShutdownHooks();

  const port = process.env.GATEWAY_SERVICE_PORT ?? 3000;
  await app.listen(port);

  logger.log(`Gateway service is running on port ${port}`);
  logger.log(`   API: http://localhost:${port}`);
  logger.log(`   Health: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Gateway service:', err);
  process.exit(1);
});
