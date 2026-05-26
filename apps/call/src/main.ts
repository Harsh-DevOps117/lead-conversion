import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CallModule } from './call.module';
async function bootstrap() {
  process.title = 'call';

  const logger = new Logger('CALL_SERVICE');
  const rmqUrl = process.env.RMQ_URL ?? 'amqp://localhost:5672';
  const queue = process.env.CALL_QUEUE ?? 'CALL_QUEUE';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CallModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: queue,
        queueOptions: {
          durable: false,
        },
      },
    },
  );

  app.listen();
  logger.log(`Call service is running on port ${queue} and rmq url: ${rmqUrl}`);
}

bootstrap();
