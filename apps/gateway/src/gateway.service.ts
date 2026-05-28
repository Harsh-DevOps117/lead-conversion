import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';

@Injectable()
export class GatewayService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('LEAD_SERVICE') private readonly leadClient: ClientProxy,
    @Inject('CALL_SERVICE') private readonly callClient: ClientProxy,
  ) {}

  async registerTenant(signUpDto: TenantRegistrationDto) {
    return await firstValueFrom(this.authClient.send('auth.signup', signUpDto));
  }

  async login(loginDto: LoginDto) {
    return await firstValueFrom(this.authClient.send('auth.login', loginDto));
  }

  async getHealthStatus(): Promise<any> {
    const ping = async (serviceName: string, client: ClientProxy) => {
      console.log(`Pinging ${serviceName}`);
      try {
        const result = await firstValueFrom(
          client.send('service.ping', { from: 'gateway' }),
        );
        return { ok: true, service: serviceName, result };
      } catch (e: any) {
        return {
          ok: false,
          service: serviceName,
          error: e?.message ?? 'unknown error',
        };
      }
    };

    const [auth, lead, call] = await Promise.all([
      ping('auth', this.authClient),
      ping('lead', this.leadClient),
      ping('call', this.callClient),
    ]);

    const ok = [auth, lead, call].every((i) => i.ok);

    return {
      ok,
      gateway: {
        name: 'Gateway',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      services: {
        auth,
        lead,
        call,
      },
    };
  }
}
