import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  RequestTimeoutException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';
import { CreateLeadDto } from '../../libs/dto/leadDTO';

@Injectable()
export class GatewayService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('LEAD_SERVICE') private readonly leadClient: ClientProxy,
    @Inject('CALL_SERVICE') private readonly callClient: ClientProxy,
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
  ) {}

  // ==========================================
  // ---------- AUTH SERVICE METHODS ----------
  // ==========================================

  async registerTenant(signUpDto: TenantRegistrationDto) {
    return firstValueFrom(
      this.authClient.send('auth.signup', signUpDto).pipe(
        catchError((error) => {
          throw new HttpException(
            error.message || 'Signup failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  async login(loginDto: LoginDto) {
    return firstValueFrom(
      this.authClient.send('auth.login', loginDto).pipe(
        catchError((error) => {
          throw new HttpException(
            error.message || 'Invalid credentials',
            error.statusCode || HttpStatus.UNAUTHORIZED,
          );
        }),
      ),
    );
  }

  async refreshTokens(userId: number, refreshToken: string) {
    return firstValueFrom(
      this.authClient.send('auth.refresh', { userId, refreshToken }).pipe(
        catchError((error) => {
          throw new HttpException(
            error.message || 'Invalid or expired refresh token',
            error.statusCode || HttpStatus.FORBIDDEN,
          );
        }),
      ),
    );
  }

  async logout(userId: number) {
    return firstValueFrom(
      this.authClient.send('auth.logout', { userId }).pipe(
        catchError((error) => {
          throw new HttpException(
            error.message || 'Logout failed',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  // ==========================================
  // ---------- LEAD SERVICE METHODS ----------
  // ==========================================

  private handleLeadError(error: any) {
    if (error instanceof TimeoutError) {
      console.error('🔥 ERROR FROM LEAD SERVICE:', error);
      throw new RequestTimeoutException('Lead service is unresponsive');
    }
    throw new HttpException(
      error.message || 'Lead service error',
      error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async createLead(companyId: string, createLeadDto: CreateLeadDto) {
    return firstValueFrom(
      this.leadClient.send('lead.create', { companyId, ...createLeadDto }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  async getAllLeads(companyId: string, status?: string) {
    return firstValueFrom(
      this.leadClient.send('lead.findAll', { companyId, status }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  async getSingleLead(leadId: string, companyId: string) {
    return firstValueFrom(
      this.leadClient.send('lead.findOne', { leadId, companyId }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  async updateLead(leadId: string, companyId: string, updateData: any) {
    return firstValueFrom(
      this.leadClient
        .send('lead.update', { leadId, companyId, updateData })
        .pipe(
          timeout(5000),
          catchError((error) => {
            throw this.handleLeadError(error);
          }),
        ),
    );
  }

  async deleteLead(leadId: string, companyId: string) {
    return firstValueFrom(
      this.leadClient.send('lead.delete', { leadId, companyId }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  // ==========================================
  // ---------- CAMPAIGN METHODS --------------
  // ==========================================

  async createCampaign(companyId: string, createData: any) {
    return firstValueFrom(
      this.leadClient
        .send('campaign.create', { companyId, ...createData })
        .pipe(
          timeout(5000),
          catchError((error) => {
            throw this.handleLeadError(error);
          }),
        ),
    );
  }

  async getCampaigns(companyId: string) {
    return firstValueFrom(
      this.leadClient.send('campaign.findAll', { companyId }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  async getSingleCampaign(campaignId: string, companyId: string) {
    return firstValueFrom(
      this.leadClient.send('campaign.findOne', { campaignId, companyId }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  async updateCampaign(campaignId: string, companyId: string, updateData: any) {
    return firstValueFrom(
      this.leadClient
        .send('campaign.update', { campaignId, companyId, updateData })
        .pipe(
          timeout(5000),
          catchError((error) => {
            throw this.handleLeadError(error);
          }),
        ),
    );
  }

  async deleteCampaign(campaignId: string, companyId: string) {
    return firstValueFrom(
      this.leadClient.send('campaign.delete', { campaignId, companyId }).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleLeadError(error);
        }),
      ),
    );
  }

  // ==========================================
  // ---------- CALL SERVICE METHODS ----------
  // ==========================================

  private handleCallError(error: any) {
    if (error instanceof TimeoutError) {
      console.error('🔥 ERROR FROM CALL SERVICE:', error);
      throw new RequestTimeoutException('Call service is unresponsive');
    }
    throw new HttpException(
      error.message || 'Call service error',
      error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async triggerOutboundCall(
    companyId: string,
    leadId: string,
    campaignId: string,
  ) {
    return firstValueFrom(
      this.callClient
        .send('call.trigger', { companyId, leadId, campaignId })
        .pipe(
          timeout(5000),
          catchError((error) => {
            throw this.handleCallError(error);
          }),
        ),
    );
  }

  async getCallSessions() {
    return firstValueFrom(
      this.callClient.send('call.sessions', {}).pipe(
        timeout(5000),
        catchError((error) => {
          throw this.handleCallError(error);
        }),
      ),
    );
  }

  // ==========================================
  // ---------- PAYMENT SERVICE METHODS -------
  // ==========================================

  async createPaymentOrder(payload: { amount: number; currency: string; receipt?: string }) {
    return firstValueFrom(
      this.paymentClient.send('create_payment_order', payload).pipe(
        timeout(5000),
        catchError((error) => {
          throw new HttpException(
            error.message || 'Payment service error',
            error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );
  }

  // ==========================================
  // ---------- SYSTEM SERVICE METHODS --------
  // ==========================================

  async getHealthStatus(): Promise<any> {
    const ping = async (serviceName: string, client: ClientProxy) => {
      console.log(`Pinging ${serviceName}`);
      try {
        const result = await firstValueFrom(
          client.send('service.ping', { from: 'gateway' }).pipe(timeout(3000)), // Added a quick timeout here too so health check doesn't hang!
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

    const [auth, lead, call, payment] = await Promise.all([
      ping('auth', this.authClient),
      ping('lead', this.leadClient),
      ping('call', this.callClient),
      ping('payment', this.paymentClient),
    ]);

    const ok = [auth, lead, call, payment].every((i) => i.ok);

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
        payment,
      },
    };
  }
}
