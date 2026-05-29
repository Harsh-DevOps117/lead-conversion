import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://localhost:5672'],
          queue: process.env.AUTH_QUEUE ?? 'AUTH_QUEUE',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dlq_routing_key',
          },
        },
      },
      {
        name: 'LEAD_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://localhost:5672'],
          queue: process.env.LEAD_QUEUE ?? 'LEAD_QUEUE',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dlq_routing_key',
          },
        },
      },
      {
        name: 'CALL_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://localhost:5672'],
          queue: process.env.CALL_QUEUE ?? 'CALL_QUEUE',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dlq_routing_key',
          },
        },
      },
      {
        name: 'PAYMENT_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://localhost:5672'],
          queue: process.env.PAYMENT_QUEUE ?? 'PAYMENT_QUEUE',
          queueOptions: {
            durable: true,
            deadLetterExchange: 'dlx',
            deadLetterRoutingKey: 'dlq_routing_key',
          },
        },
      },
    ]),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
