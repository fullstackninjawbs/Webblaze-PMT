export interface Proposal {
  _id: string;
  proposalCode: string;
  dateFound?: string;
  dateApplied?: string;
  salesExec?: { _id: string; name: string; email: string } | string;
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

  jqs?: {
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
  jobQualityScore?: number;
  qualified?: boolean;
  qualifiedOverride?: boolean | null;

  proposalWriter?: string;
  proposalTemplate?: string;
  openingHookUsed?: boolean;
  personalizationLevel?: 'low' | 'medium' | 'high';
  relevantCaseStudyUsed?: boolean;
  portfolioLinkUsed?: boolean;
  proposalLengthWords?: number;
  ctaUsed?: boolean;
  pqs?: {
    jobFit?: number;
    personalization?: number;
    relevantProof?: number;
    solutionClarity?: number;
    ctaStrength?: number;
    painPointAlignment?: number;
  };
  proposalQualityScore?: number;

  connectsUsed?: number;
  boostConnects?: number;
  totalConnects?: number;
  connectCost?: number;
  boostedVsOrganic?: 'boosted' | 'organic';

  proposalSent?: boolean;
  proposalViewed?: boolean;
  viewDate?: string;
  clientReplied?: boolean;
  replyDate?: string;
  interviewScheduled?: boolean;
  interviewDate?: string;
  followUp1Done?: boolean;
  followUp2Done?: boolean;
  followUp3Done?: boolean;
  offerReceived?: boolean;
  hired?: boolean;
  lost?: boolean;
  noResponse?: boolean;
  lostReason?: string;

  currentStage?: 'applied' | 'sent' | 'viewed' | 'replied' | 'interview' | 'offer' | 'won' | 'lost' | 'no_response';
  nextFollowUpDate?: string;
  nextAction?: string;
  notes?: string;
  wonRevenue?: number;
  daysToFirstResponse?: number;
  salesCycleDays?: number;
  followUpsRequired?: number;
  followUpsCompleted?: number;
  weekStarting?: string;
  month?: string;
  dayApplied?: string;
  repeatClient?: boolean;
  dateClosed?: string;
  
  convertedProjectId?: any;
}
