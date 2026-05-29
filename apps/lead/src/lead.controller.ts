import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateLeadDto } from '../../libs/dto/leadDTO';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LeadService } from './lead.service';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post('manual')
  async createManualLead(
    @Body() createLeadDto: CreateLeadDto,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.leadService.createLead(companyId, createLeadDto);
  }

  @Get()
  async getAllLeads(@Req() req: any, @Query('status') status?: string) {
    const companyId = req.user.companyId;
    return this.leadService.findAllForCompany(companyId, status);
  }

  @Get(':id')
  async getSingleLead(@Param('id') leadId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.leadService.findOneLead(leadId, companyId);
  }

  @Put(':id')
  async updateLead(
    @Param('id') leadId: string,
    @Body() updateData: any,
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.leadService.updateLead(leadId, companyId, updateData);
  }

  @Delete(':id')
  async deleteLead(@Param('id') leadId: string, @Req() req: any) {
    const companyId = req.user.companyId;
    return this.leadService.deleteLead(leadId, companyId);
  }

  // ==========================================
  // --------- MICROSERVICE HANDLERS ---------
  // ==========================================

  @MessagePattern('lead.create')
  async handleCreateLead(@Payload() payload: any) {
    const { companyId, ...createLeadDto } = payload;
    return this.leadService.createLead(companyId, createLeadDto);
  }

  @MessagePattern('lead.findAll')
  async handleFindAllLeads(@Payload() payload: any) {
    const { companyId, status } = payload;
    return this.leadService.findAllForCompany(companyId, status);
  }

  @MessagePattern('lead.findOne')
  async handleFindOneLead(@Payload() payload: any) {
    const { leadId, companyId } = payload;
    return this.leadService.findOneLead(leadId, companyId);
  }

  @MessagePattern('lead.update')
  async handleUpdateLead(@Payload() payload: any) {
    const { leadId, companyId, updateData } = payload;
    return this.leadService.updateLead(leadId, companyId, updateData);
  }

  @MessagePattern('lead.delete')
  async handleDeleteLead(@Payload() payload: any) {
    const { leadId, companyId } = payload;
    return this.leadService.deleteLead(leadId, companyId);
  }

  @MessagePattern('service.ping')
  async handlePing(@Payload() payload: any) {
    return this.leadService.getHello();
  }
}
