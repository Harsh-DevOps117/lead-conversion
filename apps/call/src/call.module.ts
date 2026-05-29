import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport, ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CallController } from './call.controller';
import { CallService } from './call.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LEAD_SERVICE_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL ?? 'amqp://localhost:5672'],
          queue: process.env.LEAD_QUEUE ?? 'LEAD_QUEUE',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  providers: [
    {
      provide: 'CampaignService',
      useFactory: (client: ClientProxy) => ({
        findOneCampaign: async (campaignId: string, companyId: string) => {
          return firstValueFrom(
            client.send('campaign.findOne', { campaignId, companyId })
          );
        },
      }),
      inject: ['LEAD_SERVICE_CLIENT'],
    },
    {
      provide: 'LeadsService',
      useFactory: (client: ClientProxy) => ({
        getSingleLead: async (leadId: string, companyId: string) => {
          return firstValueFrom(
            client.send('lead.findOne', { leadId, companyId })
          );
        },
      }),
      inject: ['LEAD_SERVICE_CLIENT'],
    },
  ],
  exports: ['CampaignService', 'LeadsService'],
})
class ServicesModule {}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServicesModule,
  ],
  controllers: [CallController],
  providers: [CallService],
})
export class CallModule {}
