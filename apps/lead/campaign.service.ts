import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignHydratedDocument } from './schema/campaignSchema';

@Injectable()
export class CampaignService {
  constructor(
    @InjectModel(Campaign.name)
    private readonly campaignModel: Model<CampaignHydratedDocument>,
  ) { }

  async createCampaign(companyId: string, createData: any) {
    console.log("createCampaign received:", { companyId, ...createData });
    const newCampaign = new this.campaignModel({
      companyId,
      ...createData,
    });
    return newCampaign.save();
  }

  async findAllForCompany(companyId: string) {
    // Returns newest campaigns first
    return this.campaignModel
      .find({ companyId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneCampaign(campaignId: string, companyId: string) {
    const campaign = await this.campaignModel
      .findOne({ _id: campaignId, companyId })
      .exec();
    if (!campaign) {
      throw new NotFoundException('Campaign not found or unauthorized');
    }
    return campaign;
  }

  async updateCampaign(
    campaignId: string,
    companyId: string,
    updateData: Partial<Campaign>,
  ) {
    const updated = await this.campaignModel
      .findOneAndUpdate(
        { _id: campaignId, companyId },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Campaign not found');
    }
    return updated;
  }

  async deleteCampaign(campaignId: string, companyId: string) {
    const deleted = await this.campaignModel
      .findOneAndDelete({
        _id: campaignId,
        companyId,
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Campaign not found or already deleted');
    }
    return {
      success: true,
      message: 'Campaign deleted successfully',
      id: campaignId,
    };
  }
}
