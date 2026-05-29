import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { LoginDto, TenantRegistrationDto } from '../../libs/dto/authDTO';
import { CreateLeadDto } from '../../libs/dto/leadDTO';
import { JwtAuthGuard } from '../src/jwt-auth.guard';
import { GatewayService } from './gateway.service';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  private extractTokenPayload(token: string): any {
    try {
      const payloadBase64 = token.split('.')[1];
      return JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
    } catch (error) {
      throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED);
    }
  }

  // ==========================================
  // ---------- AUTH ENDPOINTS ----------------
  // ==========================================

  @Post('auth/signup')
  async registerTenant(@Body() signUpDto: TenantRegistrationDto) {
    return this.gatewayService.registerTenant(signUpDto);
  }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.gatewayService.login(loginDto);
  }

  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new HttpException(
        'Refresh token is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = this.extractTokenPayload(refreshToken);
    const userId = Number(payload.sub);
    return this.gatewayService.refreshTokens(userId, refreshToken);
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Missing or invalid Authorization header',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const accessToken = authHeader.split(' ')[1];
    const payload = this.extractTokenPayload(accessToken);
    const userId = Number(payload.sub);

    return this.gatewayService.logout(userId);
  }

  // ==========================================
  // ---------- LEAD ENDPOINTS ----------------
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Post('leads/manual')
  async createManualLead(
    @Body() createLeadDto: CreateLeadDto,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId; // Populated by JwtAuthGuard
    return this.gatewayService.createLead(companyId, createLeadDto);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get('leads')
  async getAllLeads(@Req() req: any, @Query('status') status?: string) {
    const companyId = req.user.companyId;
    return this.gatewayService.getAllLeads(companyId, status);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get('leads/:id')
  async getSingleLead(@Param('id') leadId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.gatewayService.getSingleLead(leadId, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('leads/:id')
  async updateLead(
    @Param('id') leadId: string,
    @Body() updateData: any,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.gatewayService.updateLead(leadId, companyId, updateData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('leads/:id')
  async deleteLead(@Param('id') leadId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.gatewayService.deleteLead(leadId, companyId);
  }

  // ==========================================
  // ---------- CAMPAIGN ENDPOINTS ------------
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Post('campaigns')
  async createCampaign(@Body() createData: any, @Req() req: any) {
    console.log("Gateway received createCampaign:", createData);
    const companyId = req.user.companyId;
    return this.gatewayService.createCampaign(companyId, createData);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get('campaigns')
  async getCampaigns(@Req() req: any) {
    const companyId = req.user.companyId;
    return this.gatewayService.getCampaigns(companyId);
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get('campaigns/:id')
  async getSingleCampaign(@Param('id') campaignId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.gatewayService.getSingleCampaign(campaignId, companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('campaigns/:id')
  async updateCampaign(
    @Param('id') campaignId: string,
    @Body() updateData: any,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.gatewayService.updateCampaign(
      campaignId,
      companyId,
      updateData,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') campaignId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.gatewayService.deleteCampaign(campaignId, companyId);
  }

  // ==========================================
  // ---------- CALL ENDPOINTS ----------------
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Post('calls/trigger')
  async triggerOutboundCall(
    @Body() body: { leadId: string; campaignId: string },
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.gatewayService.triggerOutboundCall(
      companyId,
      body.leadId,
      body.campaignId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(CacheInterceptor)
  @Get('calls/sessions')
  async getCallSessions() {
    return this.gatewayService.getCallSessions();
  }

  // ==========================================
  // ---------- PAYMENT ENDPOINTS -------------
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @Post('payment/order')
  async createPaymentOrder(@Body() body: { amount: number; currency: string; receipt?: string }) {
    return this.gatewayService.createPaymentOrder(body);
  }

  // ==========================================
  // ---------- SYSTEM ENDPOINTS --------------
  // ==========================================

  @Get('health')
  async healthCheck() {
    return this.gatewayService.getHealthStatus();
  }
}
