import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SaaSLeadHydratedDocument = HydratedDocument<SaaSLead>;

export enum LeadStatus {
  PENDING = 'pending',
  AI_CALLING = 'ai_calling',
  QUALIFIED = 'qualified',
  DISQUALIFIED = 'disqualified',
  HANDED_OFF = 'handed_off',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

@Schema({ timestamps: true })
export class SaaSLead {
  // --- Core Identifiers ---
  @Prop({ type: String, required: true, index: true })
  companyId!: string;

  @Prop({ type: String, index: true })
  campaignId?: string;

  // --- Lead Information ---
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  phone!: string;

  @Prop({ trim: true, lowercase: true, index: true })
  email?: string;

  // --- Ingestion Context ---
  @Prop({ required: true, default: 'manual_entry' })
  source!: string;

  @Prop({ type: String })
  productOfInterest?: string;

  @Prop({ type: Object })
  rawMetaData?: Record<string, any>;

  // --- Funnel State ---
  // INDEX: The dashboard will constantly filter by status (e.g., "Show qualified")
  @Prop({
    type: String,
    enum: LeadStatus,
    default: LeadStatus.PENDING,
    index: true,
  })
  status!: LeadStatus;

  // --- AI Calling Logs ---
  @Prop({ type: String })
  aiCallSid?: string;

  @Prop({ type: String })
  aiTranscript?: string;

  @Prop({ type: String })
  aiSummary?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  interestScore?: number;

  @Prop({ type: String })
  clientAgentId?: string;

  // --- The Final Guy's Workspace ---
  @Prop({ type: String })
  humanNotes?: string;
}

export const SaaSLeadSchema = SchemaFactory.createForClass(SaaSLead);

// Compound index for fast dashboard filtering and sorting
SaaSLeadSchema.index({ companyId: 1, status: 1, createdAt: -1 });
