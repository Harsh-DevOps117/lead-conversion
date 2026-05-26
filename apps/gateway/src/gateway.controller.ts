import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class GatewayController {
  constructor(
    @Inject('LEAD_SERVICE') private readonly leadClient: ClientProxy,
    @Inject('CALL_SERVICE') private readonly callClient: ClientProxy,
  ) {}

  @Get('health')
  async helthCheck(): Promise<any> {
    const ping = async (serviceName: string, client: ClientProxy) => {
      try {
        const result = await firstValueFrom(
          client.send('service.ping', {
            from: 'gateway',
          }),
        );

        return {
          ok: true,
          service: serviceName,
          result: result,
        };
      } catch (e: any) {
        return {
          ok: false,
          service: serviceName,
          errorr: e?.message ?? 'unknown error',
        };
      }
    };

    const [lead, call] = await Promise.all([
      ping('lead', this.leadClient),
      ping('call', this.callClient),
    ]);

    const ok = [lead, call].every((i) => i.ok);

    return {
      ok,
      gateway: {
        Name: 'gateway',
        Date: new Date().toISOString(),
        version: '1.0.0',
      },
      lead,
      call,
    };
  }
}
