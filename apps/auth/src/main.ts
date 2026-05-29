import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AuthModule } from './auth.module';
import { MicroserviceExceptionFilter } from './rpc-exception.filter';

async function bootstrap() {
  process.title = 'auth';
  const logger = new Logger('AUTH_SERVICE');
  const rmqUrl = process.env.RMQ_URL ?? 'amqp://localhost:5672';
  const queue = process.env.AUTH_QUEUE ?? 'AUTH_QUEUE';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: queue,
        queueOptions: {
          durable: true,
          deadLetterExchange: 'dlx',
          deadLetterRoutingKey: 'dlq_routing_key',
        },
      },
    },
  );
  app.useGlobalFilters(new MicroserviceExceptionFilter());
  app.listen();
  logger.log(`Auth service is running on port ${queue} and rmq url: ${rmqUrl}`);
}
bootstrap();
