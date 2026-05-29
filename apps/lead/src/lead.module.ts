import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { CampaignController } from '../campaign.controller';
import { CampaignService } from '../campaign.service';
import { Campaign, CampaignSchema } from '../schema/campaignSchema';
import { SaaSLead, SaaSLeadSchema } from '../schema/leadSchema';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/lead',
    ),
    MongooseModule.forFeature([
      {
        name: SaaSLead.name,
        schema: SaaSLeadSchema,
      },
      {
        name: Campaign.name,
        schema: CampaignSchema,
      },
    ]),
    ClientsModule.register([
      {
        name: 'RMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RMQ_URL || 'amqp://localhost:5672'],
          queue: 'LEAD_QUEUE',
          queueOptions: { durable: false },
        },
      },
    ]),
  ],
  controllers: [LeadController, CampaignController],
  providers: [LeadService, JwtService, CampaignService],
})
export class LeadModule {}
