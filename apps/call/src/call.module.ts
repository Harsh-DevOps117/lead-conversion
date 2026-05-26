import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CallController } from './call.controller';
import { CallService } from './call.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [CallController],
  providers: [CallService],
})
export class CallModule {}
