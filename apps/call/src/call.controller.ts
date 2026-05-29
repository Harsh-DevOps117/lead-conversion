import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CallService } from './call.service';

@Controller()
export class CallController {
  constructor(private readonly callService: CallService) {}

  @MessagePattern('service.ping')
  ping(): {
    success: boolean;
    message: string;
    data: Date;
    serviceName: string;
  } {
    return this.callService.ping();
  }

  @MessagePattern('call.trigger')
  async triggerOutboundCall(@Payload() payload: {
    companyId: string;
    leadId: string;
    campaignId: string;
  }): Promise<any> {
    return this.callService.triggerOutboundCall(payload);
  }

  @MessagePattern('call.sessions')
  async getActiveSessions(): Promise<any> {
    return this.callService.getActiveSessions();
  }
}
