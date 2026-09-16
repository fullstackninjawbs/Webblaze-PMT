import mongoose, { Schema, Document } from 'mongoose';

export interface IProposal extends Document {
  // Identity & Discovery
  proposalCode: string;
  dateFound?: Date;
  dateApplied?: Date;
  salesExec?: mongoose.Types.ObjectId;
  upworkProfile?: string;
  jobTitle?: string;
  jobUrl?: string;
  clientName?: string;
  clientCountry?: string;
  clientIndustry?: string;
  serviceCategory?: string;
  jobType?: 'fixed_price' | 'hourly';
  jobBudget?: number;
  estimatedProjectValue?: number;
  jobPostedAgeHrs?: number;
  clientHiringHistory?: number;
  clientSpendOnUpwork?: number;
  paymentVerified?: boolean;
  proposalCompetitionCount?: number;
  clientActivityLevel?: 'very_active' | 'moderate' | 'low';

  // Job Quality Score (JQS)
  jqs: {
    skillFit?: number;
    budgetFit?: number;
    clientQuality?: number;
    jobClarity?: number;
    portfolioFit?: number;
    hiringProbability?: number;
    competitionScore?: number;
    timingScore?: number;
    historicalActivity?: number;
  };
  jobQualityScore?: number; // AUTO
  qualified?: boolean; // AUTO or manual override
  qualifiedOverride?: boolean; // manual override flag (per MS 2)

  // Proposal Authoring & PQS
  proposalWriter?: mongoose.Types.ObjectId;
  proposalTemplate?: string;
  openingHookUsed?: boolean;
  personalizationLevel?: 'low' | 'medium' | 'high';
  relevantCaseStudyUsed?: boolean;
  portfolioLinkUsed?: boolean;
  proposalLengthWords?: number;
  ctaUsed?: boolean;
  pqs: {
    jobFit?: number;
    personalization?: number;
    relevantProof?: number;
    solutionClarity?: number;
    ctaStrength?: number;
    painPointAlignment?: number;
  };
  proposalQualityScore?: number; // AUTO

  // Connects / Spend
  connectsUsed?: number;
  boostConnects?: number;
  totalConnects?: number; // AUTO
  connectCost?: number;
  boostedVsOrganic?: 'boosted' | 'organic';

  // Pipeline Checkpoints
  proposalSent?: boolean;
  proposalViewed?: boolean;
  viewDate?: Date;
  clientReplied?: boolean;
  replyDate?: Date;
  interviewScheduled?: boolean;
  interviewDate?: Date;
  followUp1Done?: boolean;
  followUp2Done?: boolean;
  followUp3Done?: boolean;
  offerReceived?: boolean;
  hired?: boolean;
  lost?: boolean;
  noResponse?: boolean; // AUTO
  lostReason?: string;

  // Auto-Computed Rollups & Manual tracking
  currentStage?: 'applied' | 'sent' | 'viewed' | 'replied' | 'interview' | 'offer' | 'won' | 'lost' | 'no_response'; // AUTO
  nextFollowUpDate?: Date;
  nextAction?: string;
  notes?: string;
  wonRevenue?: number;
  daysToFirstResponse?: number; // AUTO
  salesCycleDays?: number; // AUTO
  followUpsRequired?: number; // AUTO
  followUpsCompleted?: number; // AUTO
  weekStarting?: Date; // AUTO
  month?: string; // AUTO
  dayApplied?: string; // AUTO
  repeatClient?: boolean; // AUTO
  dateClosed?: Date; // AUTO

  // Extra MS8 Linking
  convertedProjectId?: mongoose.Types.ObjectId;
}

const ProposalSchema: Schema = new Schema(
  {
    proposalCode: { type: String, unique: true },
    dateFound: { type: Date },
    dateApplied: { type: Date },
    salesExec: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    upworkProfile: { type: String },
    jobTitle: { type: String },
    jobUrl: { type: String },
    clientName: { type: String, index: true },
    clientCountry: { type: String },
    clientIndustry: { type: String },
    serviceCategory: { type: String },
    jobType: { type: String, enum: ['fixed_price', 'hourly'] },
    jobBudget: { type: Number },
    estimatedProjectValue: { type: Number },
    jobPostedAgeHrs: { type: Number },
    clientHiringHistory: { type: Number },
    clientSpendOnUpwork: { type: Number },
    paymentVerified: { type: Boolean },
    proposalCompetitionCount: { type: Number },
    clientActivityLevel: { type: String, enum: ['very_active', 'moderate', 'low'] },

    jqs: {
      skillFit: { type: Number },
      budgetFit: { type: Number },
      clientQuality: { type: Number },
      jobClarity: { type: Number },
      portfolioFit: { type: Number },
      hiringProbability: { type: Number },
      competitionScore: { type: Number },
      timingScore: { type: Number },
      historicalActivity: { type: Number },
    },
    jobQualityScore: { type: Number },
    qualified: { type: Boolean },
    qualifiedOverride: { type: Boolean, default: null },

    proposalWriter: { type: Schema.Types.ObjectId, ref: 'User' },
    proposalTemplate: { type: String },
    openingHookUsed: { type: Boolean },
    personalizationLevel: { type: String, enum: ['low', 'medium', 'high'] },
    relevantCaseStudyUsed: { type: Boolean },
    portfolioLinkUsed: { type: Boolean },
    proposalLengthWords: { type: Number },
    ctaUsed: { type: Boolean },
    pqs: {
      jobFit: { type: Number },
      personalization: { type: Number },
      relevantProof: { type: Number },
      solutionClarity: { type: Number },
      ctaStrength: { type: Number },
      painPointAlignment: { type: Number },
    },
    proposalQualityScore: { type: Number },

    connectsUsed: { type: Number },
    boostConnects: { type: Number },
    totalConnects: { type: Number },
    connectCost: { type: Number },
    boostedVsOrganic: { type: String, enum: ['boosted', 'organic'] },

    proposalSent: { type: Boolean, default: false },
    proposalViewed: { type: Boolean, default: false },
    viewDate: { type: Date },
    clientReplied: { type: Boolean, default: false },
    replyDate: { type: Date },
    interviewScheduled: { type: Boolean, default: false },
    interviewDate: { type: Date },
    followUp1Done: { type: Boolean, default: false },
    followUp2Done: { type: Boolean, default: false },
    followUp3Done: { type: Boolean, default: false },
    offerReceived: { type: Boolean, default: false },
    hired: { type: Boolean, default: false },
    lost: { type: Boolean, default: false },
    noResponse: { type: Boolean, default: false },
    lostReason: { type: String },

    currentStage: { 
      type: String, 
      enum: ['applied', 'sent', 'viewed', 'replied', 'interview', 'offer', 'won', 'lost', 'no_response'],
      index: true
    },
    nextFollowUpDate: { type: Date },
    nextAction: { type: String },
    notes: { type: String },
    wonRevenue: { type: Number },
    daysToFirstResponse: { type: Number },
    salesCycleDays: { type: Number },
    followUpsRequired: { type: Number },
    followUpsCompleted: { type: Number },
    weekStarting: { type: Date },
    month: { type: String },
    dayApplied: { type: String },
    repeatClient: { type: Boolean, default: false },
    dateClosed: { type: Date },
    
    convertedProjectId: { type: Schema.Types.ObjectId, ref: 'Project' }
  },
  { timestamps: true }
);

// Indexes are specified directly on the schema fields via `index: true` (salesExec, currentStage, clientName)
// Adding dateApplied index here because it doesn't have it inline
ProposalSchema.index({ dateApplied: 1 });

import { computeDerivedFields } from './proposal.service';

ProposalSchema.pre('save', async function(next) {
  // `this` refers to the document being saved
  await computeDerivedFields(this);
  next();
});

export const Proposal = mongoose.model<IProposal>('Proposal', ProposalSchema);
