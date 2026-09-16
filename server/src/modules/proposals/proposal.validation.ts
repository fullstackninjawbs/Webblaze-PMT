import { z } from 'zod';

// We do NOT include AUTO fields here (e.g. currentStage, jobQualityScore, totalConnects).
// By not including them in the Zod schema, they will be stripped automatically
// when using the schema to parse the request body.

export const createProposalSchema = z.object({
  // Identity & Discovery
  dateFound: z.coerce.date().optional(),
  dateApplied: z.coerce.date().optional(),
  salesExec: z.string().optional(),
  upworkProfile: z.string().optional(),
  jobTitle: z.string().optional(),
  jobUrl: z.string().optional(),
  clientName: z.string().optional(),
  clientCountry: z.string().optional(),
  clientIndustry: z.string().optional(),
  serviceCategory: z.string().optional(),
  jobType: z.enum(['fixed_price', 'hourly']).optional(),
  jobBudget: z.number().optional(),
  estimatedProjectValue: z.number().optional(),
  jobPostedAgeHrs: z.number().optional(),
  clientHiringHistory: z.number().optional(),
  clientSpendOnUpwork: z.number().optional(),
  paymentVerified: z.boolean().optional(),
  proposalCompetitionCount: z.number().optional(),
  clientActivityLevel: z.enum(['very_active', 'moderate', 'low']).optional(),

  // Job Quality Score (JQS) - Subfields
  jqs: z.object({
    skillFit: z.number().min(1).max(10).optional(),
    budgetFit: z.number().min(1).max(10).optional(),
    clientQuality: z.number().min(1).max(10).optional(),
    jobClarity: z.number().min(1).max(10).optional(),
    portfolioFit: z.number().min(1).max(10).optional(),
    hiringProbability: z.number().min(1).max(10).optional(),
    competitionScore: z.number().min(1).max(10).optional(),
    timingScore: z.number().min(1).max(10).optional(),
    historicalActivity: z.number().min(1).max(10).optional(),
  }).optional(),
  qualifiedOverride: z.boolean().nullable().optional(), // manual override for MS 2

  // Proposal Authoring & PQS
  proposalWriter: z.string().optional(),
  proposalTemplate: z.string().optional(),
  openingHookUsed: z.boolean().optional(),
  personalizationLevel: z.enum(['low', 'medium', 'high']).optional(),
  relevantCaseStudyUsed: z.boolean().optional(),
  portfolioLinkUsed: z.boolean().optional(),
  proposalLengthWords: z.number().optional(),
  ctaUsed: z.boolean().optional(),
  pqs: z.object({
    jobFit: z.number().min(1).max(10).optional(),
    personalization: z.number().min(1).max(10).optional(),
    relevantProof: z.number().min(1).max(10).optional(),
    solutionClarity: z.number().min(1).max(10).optional(),
    ctaStrength: z.number().min(1).max(10).optional(),
    painPointAlignment: z.number().min(1).max(10).optional(),
  }).optional(),

  // Connects / Spend
  connectsUsed: z.number().optional(),
  boostConnects: z.number().optional(),
  connectCost: z.number().optional(),
  boostedVsOrganic: z.enum(['boosted', 'organic']).optional(),

  // Pipeline Checkpoints
  proposalSent: z.boolean().optional(),
  proposalViewed: z.boolean().optional(),
  viewDate: z.coerce.date().optional(),
  clientReplied: z.boolean().optional(),
  replyDate: z.coerce.date().optional(),
  interviewScheduled: z.boolean().optional(),
  interviewDate: z.coerce.date().optional(),
  followUp1Done: z.boolean().optional(),
  followUp2Done: z.boolean().optional(),
  followUp3Done: z.boolean().optional(),
  offerReceived: z.boolean().optional(),
  hired: z.boolean().optional(),
  lost: z.boolean().optional(),
  lostReason: z.string().optional(),

  // Manual tracking fields
  nextFollowUpDate: z.coerce.date().optional(),
  nextAction: z.string().optional(),
  notes: z.string().optional(),
  wonRevenue: z.number().optional(),
});

export const updateProposalSchema = createProposalSchema.partial();
