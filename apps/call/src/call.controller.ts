import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CallService } from './call.service';

@Controller()
export class CallController {
  constructor(private readonly callService: CallService) {}

  @MessagePattern('service.ping')
  ping(): {
    sucess: boolean;
    message: string;
    data: Date;
    servicecName: string;
  } {
    return this.callService.ping();
  }
}
