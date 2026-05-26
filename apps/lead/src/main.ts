import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { LeadModule } from './lead.module';

async function bootstrap() {
  process.title = 'lead';

  const queue = process.env.LEAD_QUEUE ?? 'LEAD_QUEUE';
  const rmqUrl = process.env.RMQ_URL ?? 'amqp://localhost:5672';

  const logger = new Logger('LEAD_SERVICE');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    LeadModule,
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
  logger.log(`Lead service is running on port ${queue} and rmq url: ${rmqUrl}`);
}

bootstrap();
