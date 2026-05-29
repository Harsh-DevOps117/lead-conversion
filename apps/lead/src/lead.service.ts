import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateLeadDto } from '../../libs/dto/leadDTO';
import { SaaSLead, SaaSLeadHydratedDocument } from '../schema/leadSchema';

@Injectable()
export class LeadService {
  constructor(
    @InjectModel(SaaSLead.name)
    private readonly leadModel: Model<SaaSLeadHydratedDocument>,
    @Inject('RMQ_SERVICE')
    private readonly rmqClient: ClientProxy,
  ) {}

  async createLead(companyId: string, createLeadDto: CreateLeadDto) {
    const newLead = new this.leadModel({
      companyId,
      ...createLeadDto,
    });
    const savedLead = await newLead.save();

    this.rmqClient.emit('lead.created', {
      leadId: savedLead._id,
      phone: savedLead.phone,
      productOfInterest: savedLead.productOfInterest,
      companyId: savedLead.companyId,
    });

    return savedLead;
  }

  async findAllForCompany(companyId: string, statusFilter?: string) {
    const query: any = { companyId };
    if (statusFilter) {
      query.status = statusFilter;
    }

    return this.leadModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOneLead(leadId: string, companyId: string) {
    const lead = await this.leadModel
      .findOne({ _id: leadId, companyId })
      .exec();
    if (!lead) {
      throw new NotFoundException('Lead not found or unauthorized');
    }
    return lead;
  }

  async updateLead(
    leadId: string,
    companyId: string,
    updateData: Partial<SaaSLead>,
  ) {
    return this.leadModel
      .findOneAndUpdate(
        { _id: leadId, companyId },
        { $set: updateData },
        { new: true },
      )
      .exec();
  }

  async deleteLead(leadId: string, companyId: string) {
    const deletedLead = await this.leadModel
      .findOneAndDelete({
        _id: leadId,
        companyId,
      })
      .exec();

    if (!deletedLead) {
      throw new NotFoundException('Lead not found or already deleted');
    }
    return { success: true, message: 'Lead successfully deleted', id: leadId };
  }

  getHello(): {
    sucess: boolean;
    message: string;
    data: Date;
    servicecName: string;
  } {
    return {
      sucess: true,
      message: 'pong',
      data: new Date(),
      servicecName: 'lead',
    };
  }
}
