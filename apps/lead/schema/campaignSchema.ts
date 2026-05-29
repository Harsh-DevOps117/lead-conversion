import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CampaignHydratedDocument = HydratedDocument<Campaign>;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ type: String, required: true, index: true })
  companyId!: string;

  @Prop({ type: String, required: true, trim: true })
  campaignName!: string;

  @Prop({ type: String, required: true })
  productName!: string;

  @Prop({ type: String, required: true })
  productDescription!: string;

  @Prop({ type: String, required: true })
  aiSystemPrompt!: string;

  @Prop({ type: [String], default: [] })
  commonObjections!: string[];

  @Prop({ type: [String], default: [] })
  faqs!: string[];

  @Prop({ default: true })
  isActive!: boolean;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
CampaignSchema.index({ companyId: 1, isActive: 1 });
