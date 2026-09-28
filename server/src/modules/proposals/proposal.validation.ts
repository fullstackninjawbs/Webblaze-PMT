import { z } from 'zod';

// Preprocessing helpers: converts empty string "" or null to undefined
const optionalDate = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const d = new Date(val as any);
  return isNaN(d.getTime()) ? undefined : d;
}, z.date().optional());

const optionalNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().optional());

const optionalScore = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().min(1).max(10).optional());

const optionalString = z.preprocess((val) => {
  if (val === null || val === undefined) return undefined;
  return String(val);
}, z.string().optional());

const optionalObjectId = z.preprocess((val: any) => {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'object' && val._id) return String(val._id);
  if (typeof val === 'string' && val.trim() !== '' && val !== '[object Object]') return val.trim();
  return undefined;
}, z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId').optional());

const optionalEnum = <T extends [string, ...string[]]>(values: T) => z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  return val;
}, z.enum(values).optional());

export const createProposalSchema = z.object({
  // Identity & Discovery
  proposalCode: optionalString,
  dateFound: optionalDate,
  dateApplied: optionalDate,
  salesExec: optionalObjectId,
  upworkProfile: optionalString,
  jobTitle: optionalString,
  jobUrl: optionalString,
  clientName: optionalString,
  clientCountry: optionalString,
  clientIndustry: optionalString,
  serviceCategory: optionalString,
  jobType: optionalEnum(['fixed_price', 'hourly']),
  jobBudget: optionalNumber,
  estimatedProjectValue: optionalNumber,
  jobPostedAgeHrs: optionalNumber,
  clientHiringHistory: optionalNumber,
  clientSpendOnUpwork: optionalNumber,
  paymentVerified: z.boolean().optional(),
  proposalCompetitionCount: optionalNumber,
  clientActivityLevel: optionalEnum(['very_active', 'moderate', 'low']),

  // Job Quality Score (JQS) - Subfields
  jqs: z.object({
    skillFit: optionalScore,
    budgetFit: optionalScore,
    clientQuality: optionalScore,
    jobClarity: optionalScore,
    portfolioFit: optionalScore,
    hiringProbability: optionalScore,
    competitionScore: optionalScore,
    timingScore: optionalScore,
    historicalActivity: optionalScore,
  }).optional(),
  qualifiedOverride: z.boolean().nullable().optional(),

  // Proposal Authoring & PQS
  proposalWriter: optionalObjectId,
  proposalTemplate: optionalString,
  openingHookUsed: z.boolean().optional(),
  personalizationLevel: optionalEnum(['low', 'medium', 'high']),
  relevantCaseStudyUsed: z.boolean().optional(),
  portfolioLinkUsed: z.boolean().optional(),
  proposalLengthWords: optionalNumber,
  ctaUsed: z.boolean().optional(),
  pqs: z.object({
    jobFit: optionalScore,
    personalization: optionalScore,
    relevantProof: optionalScore,
    solutionClarity: optionalScore,
    ctaStrength: optionalScore,
    painPointAlignment: optionalScore,
  }).optional(),

  // Connects / Spend
  connectsUsed: optionalNumber,
  boostConnects: optionalNumber,
  connectCost: optionalNumber,
  boostedVsOrganic: optionalEnum(['boosted', 'organic']),

  // Pipeline Checkpoints
  proposalSent: z.boolean().optional(),
  proposalViewed: z.boolean().optional(),
  viewDate: optionalDate,
  clientReplied: z.boolean().optional(),
  replyDate: optionalDate,
  interviewScheduled: z.boolean().optional(),
  interviewDate: optionalDate,
  followUp1Done: z.boolean().optional(),
  followUp2Done: z.boolean().optional(),
  followUp3Done: z.boolean().optional(),
  offerReceived: z.boolean().optional(),
  hired: z.boolean().optional(),
  lost: z.boolean().optional(),
  lostReason: optionalString,

  // Manual tracking fields
  nextFollowUpDate: optionalDate,
  nextAction: optionalString,
  notes: optionalString,
  wonRevenue: optionalNumber,
  isDraft: z.boolean().optional(),
  currentStage: optionalEnum(['draft', 'applied', 'sent', 'viewed', 'replied', 'interview', 'offer', 'won', 'lost', 'no_response']),
});

export const updateProposalSchema = createProposalSchema.partial();

