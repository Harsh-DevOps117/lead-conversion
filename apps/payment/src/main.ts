import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { PaymentModule } from './payment.module';

async function bootstrap() {
  process.title = 'payment';

  const logger = new Logger('PAYMENT_SERVICE');
  const rmqUrl = process.env.RMQ_URL ?? 'amqp://localhost:5672';
  const queue = process.env.PAYMENT_QUEUE ?? 'PAYMENT_QUEUE';

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
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

  await app.listen();
  logger.log(`Payment service is running on port ${queue} and rmq url: ${rmqUrl}`);
}

bootstrap();
