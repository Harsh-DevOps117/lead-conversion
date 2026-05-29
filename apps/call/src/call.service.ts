import { Inject, Injectable, Logger } from '@nestjs/common';
import * as twilio from 'twilio';

@Injectable()
export class CallService {
  private readonly logger = new Logger(CallService.name);
  private twilioClient: twilio.Twilio;

  constructor(
    @Inject('CampaignService') private readonly campaignService: any,
    @Inject('LeadsService') private readonly leadsService: any,
  ) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not found in environment variables.');
    }
  }

  /**
   * MICROSERVICE: Health check ping
   */
  ping(): {
    success: boolean;
    message: string;
    data: Date;
    serviceName: string;
  } {
    return {
      success: true,
      message: 'Call service is healthy',
      data: new Date(),
      serviceName: 'CALL_SERVICE',
    };
  }

  /**
   * MICROSERVICE: Trigger outbound call (RPC handler)
   */
  async triggerOutboundCall(payload: {
    companyId: string;
    leadId: string;
    campaignId: string;
  }): Promise<any> {
    this.logger.log(
      `[RPC] Received trigger call for lead ${payload.leadId} on campaign ${payload.campaignId}`,
    );

    try {
      // Hydrate lead and campaign details
      const lead = await this.leadsService.getSingleLead(payload.leadId, payload.companyId);
      const campaign = await this.campaignService.findOneCampaign(
        payload.campaignId,
        payload.companyId,
      );

      if (!lead || !campaign) {
        throw new Error('Lead or Campaign not found');
      }

      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized (missing credentials)');
      }

      // We use a basic TwiML string to say a greeting based on the campaign.
      // For full interactive conversational AI, this would be updated to use Twilio Media Streams (Connect & Stream TwiML).
      const twiml = new twilio.twiml.VoiceResponse();
      twiml.say(`Hi ${lead.name}, I am calling regarding ${campaign.productName}. ${campaign.productDescription}`);
      
      const call = await this.twilioClient.calls.create({
        twiml: twiml.toString(),
        to: lead.phone,
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      });

      this.logger.log(`Twilio call initiated: ${call.sid}`);

      return {
        success: true,
        message: 'Twilio call initiated successfully',
        callSid: call.sid,
        companyId: payload.companyId,
        leadId: payload.leadId,
        campaignId: payload.campaignId,
      };
    } catch (error) {
      this.logger.error(`Failed to trigger call: ${error.message}`);
      return {
        success: false,
        message: error.message,
        error: error.message,
      };
    }
  }

  /**
   * MICROSERVICE: Get active sessions
   */
  async getActiveSessions(): Promise<any> {
    return {
      activeCount: 0,
      sessions: [],
      message: 'Twilio session tracking can be implemented via webhooks',
    };
  }
}
