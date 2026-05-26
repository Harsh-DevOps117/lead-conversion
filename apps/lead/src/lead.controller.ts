import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { LeadService } from './lead.service';

@Controller()
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @MessagePattern('service.ping')
  ping(): {
    sucess: boolean;
    message: string;
    data: Date;
    servicecName: string;
  } {
    return this.leadService.getHello();
  }
}
