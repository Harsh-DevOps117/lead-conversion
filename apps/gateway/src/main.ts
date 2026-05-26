import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  process.title = 'gateway';
  const loggger = new Logger('GATEWAY_SERVICE');

  const app = await NestFactory.create(GatewayModule);
  app.enableShutdownHooks();
  await app.listen(process.env.GATEWAY_SERVICEC_PORT ?? 3000);

  loggger.log(
    `Gateway service is running on port ${process.env.GATEWAY_SERVICEC_PORT}`,
  );
}

bootstrap();
