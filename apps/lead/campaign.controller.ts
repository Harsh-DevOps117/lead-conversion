import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CampaignService } from './campaign.service';

@Controller()
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @MessagePattern('campaign.create')
  async handleCreate(@Payload() data: any) {
    const { companyId, ...createData } = data;
    return this.campaignService.createCampaign(companyId, createData);
  }

  @MessagePattern('campaign.findAll')
  async handleFindAll(@Payload() data: { companyId: string }) {
    return this.campaignService.findAllForCompany(data.companyId);
  }

  @MessagePattern('campaign.findOne')
  async handleFindOne(
    @Payload() data: { campaignId: string; companyId: string },
  ) {
    return this.campaignService.findOneCampaign(
      data.campaignId,
      data.companyId,
    );
  }

  @MessagePattern('campaign.update')
  async handleUpdate(
    @Payload() data: { campaignId: string; companyId: string; updateData: any },
  ) {
    return this.campaignService.updateCampaign(
      data.campaignId,
      data.companyId,
      data.updateData,
    );
  }

  @MessagePattern('campaign.delete')
  async handleDelete(
    @Payload() data: { campaignId: string; companyId: string },
  ) {
    return this.campaignService.deleteCampaign(data.campaignId, data.companyId);
  }
}
