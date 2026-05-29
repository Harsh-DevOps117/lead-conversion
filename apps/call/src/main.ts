import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CallModule } from './call.module';


async function bootstrap() {
  process.title = 'call';

  const logger = new Logger('CALL_SERVICE');
  const rmqUrl = process.env.RMQ_URL ?? 'amqp://localhost:5672';
  const queue = process.env.CALL_QUEUE ?? 'CALL_QUEUE';
  const httpPort = process.env.CALL_SERVICEC_PORT ?? 3002;

  // Create hybrid app: HTTP server + RMQ microservice
  const app = await NestFactory.create(CallModule);

  // Attach RMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
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
  });

  // Start hybrid server
  await app.startAllMicroservices();
  await app.listen(httpPort, '0.0.0.0');

  logger.log(`✅ Call service started successfully`);
  logger.log(`   HTTP Server: http://localhost:${httpPort}`);
  logger.log(`   RMQ Queue: ${queue}`);
  logger.log(`   RMQ URL: ${rmqUrl}`);
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap Call service:', err);
  process.exit(1);
});
