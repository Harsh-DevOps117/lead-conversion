import { Injectable } from '@nestjs/common';

@Injectable()
export class CallService {
  ping(): {
    sucess: boolean;
    message: string;
    data: Date;
    servicecName: string;
  } {
    return {
      sucess: true,
      message: 'pong',
      data: new Date(),
      servicecName: 'call',
    };
  }
}
