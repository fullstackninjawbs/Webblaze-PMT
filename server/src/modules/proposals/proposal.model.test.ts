import { Proposal } from './proposal.model';

describe('Proposal Model', () => {
  it('should contain all 78 fields specified in Milestone 1', () => {
    const schemaPaths = Object.keys(Proposal.schema.paths);
    
    const requiredFields = [
      // Identity & Discovery
      'proposalCode', 'dateFound', 'dateApplied', 'salesExec', 'upworkProfile',
      'jobTitle', 'jobUrl', 'clientName', 'clientCountry', 'clientIndustry',
      'serviceCategory', 'jobType', 'jobBudget', 'estimatedProjectValue',
      'jobPostedAgeHrs', 'clientHiringHistory', 'clientSpendOnUpwork',
      'paymentVerified', 'proposalCompetitionCount', 'clientActivityLevel',

      // JQS
      'jqs.skillFit', 'jqs.budgetFit', 'jqs.clientQuality', 'jqs.jobClarity',
      'jqs.portfolioFit', 'jqs.hiringProbability', 'jqs.competitionScore',
      'jqs.timingScore', 'jqs.historicalActivity',
      'jobQualityScore', 'qualified', 'qualifiedOverride',

      // Proposal Authoring & PQS
      'proposalWriter', 'proposalTemplate', 'openingHookUsed',
      'personalizationLevel', 'relevantCaseStudyUsed', 'portfolioLinkUsed',
      'proposalLengthWords', 'ctaUsed',
      'pqs.jobFit', 'pqs.personalization', 'pqs.relevantProof',
      'pqs.solutionClarity', 'pqs.ctaStrength', 'pqs.painPointAlignment',
      'proposalQualityScore',

      // Connects / Spend
      'connectsUsed', 'boostConnects', 'totalConnects', 'connectCost', 'boostedVsOrganic',

      // Pipeline Checkpoints
      'proposalSent', 'proposalViewed', 'viewDate', 'clientReplied', 'replyDate',
      'interviewScheduled', 'interviewDate', 'followUp1Done', 'followUp2Done',
      'followUp3Done', 'offerReceived', 'hired', 'lost', 'noResponse', 'lostReason',

      // Auto-Computed Rollups & Manual tracking
      'currentStage', 'nextFollowUpDate', 'nextAction', 'notes', 'wonRevenue',
      'daysToFirstResponse', 'salesCycleDays', 'followUpsRequired', 'followUpsCompleted',
      'weekStarting', 'month', 'dayApplied', 'repeatClient', 'dateClosed',

      // Extra
      'convertedProjectId'
    ];

    const missingFields = requiredFields.filter(field => !schemaPaths.includes(field));
    
    expect(missingFields).toEqual([]);
  });
});
