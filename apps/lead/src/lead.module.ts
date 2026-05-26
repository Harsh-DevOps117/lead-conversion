import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [LeadController],
  providers: [LeadService],
})
export class LeadModule {}
