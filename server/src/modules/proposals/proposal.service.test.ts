import { computeDerivedFields } from './proposal.service';
import { Proposal } from './proposal.model';

jest.mock('./proposal.model', () => ({
  Proposal: {
    exists: jest.fn(),
  }
}));

describe('Proposal Service - computeDerivedFields', () => {
  const now = new Date();
  const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5); // 5 days ago
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should compute jobQualityScore and qualified flag', async () => {
    const proposal: any = {
      jqs: {
        skillFit: 8,
        budgetFit: 10,
        clientQuality: 6
      }
    };
    
    await computeDerivedFields(proposal);
    expect(proposal.jobQualityScore).toBe(8); // (8+10+6)/3 = 24/3 = 8
    expect(proposal.qualified).toBe(true);
  });

  it('should compute totalConnects', async () => {
    const proposal: any = {
      connectsUsed: 16,
      boostConnects: 4
    };
    await computeDerivedFields(proposal);
    expect(proposal.totalConnects).toBe(20);
  });

  it('should compute date based fields', async () => {
    const proposal: any = {
      dateApplied: past,
      proposalSent: true,
      clientReplied: false,
    };
    await computeDerivedFields(proposal);
    expect(proposal.daysToFirstResponse).toBe(null);
    expect(proposal.followUpsRequired).toBe(1); // 5 days is >= 3 days (FOLLOW_UP_1_DAYS)
  });

  it('should process the stage state machine correctly', async () => {
    const proposal: any = { hired: true };
    await computeDerivedFields(proposal);
    expect(proposal.currentStage).toBe('won');

    const proposal2: any = { offerReceived: true };
    await computeDerivedFields(proposal2);
    expect(proposal2.currentStage).toBe('offer');
    
    const proposal3: any = { proposalSent: true, clientReplied: true };
    await computeDerivedFields(proposal3);
    expect(proposal3.currentStage).toBe('replied');
  });

  it('should flag repeatClient using Proposal.exists', async () => {
    (Proposal.exists as jest.Mock).mockResolvedValue(true);
    
    const proposal: any = { clientName: 'Acme Corp' };
    await computeDerivedFields(proposal);
    
    expect(proposal.repeatClient).toBe(true);
    expect(Proposal.exists).toHaveBeenCalledWith(expect.objectContaining({ clientName: 'Acme Corp', hired: true }));
  });
});
