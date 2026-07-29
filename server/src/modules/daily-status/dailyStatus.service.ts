import { DailyStatus, IDailyStatus } from './dailyStatus.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';

export const createDailyStatus = async (data: Partial<IDailyStatus>): Promise<IDailyStatus> => {
  const dailyStatus = await DailyStatus.create(data);
  return dailyStatus.populate([
    { path: 'user', select: 'name email avatarUrl role' },
    { path: 'project', select: 'name' }
  ]);
};

export const getMyDailyStatuses = async (userId: string): Promise<IDailyStatus[]> => {
  return DailyStatus.find({ user: userId })
    .populate('project', 'name')
    .sort({ date: -1, createdAt: -1 });
};

export const getTeamDailyStatuses = async (userRole: Role, userId: string): Promise<IDailyStatus[]> => {
  // Access control check: Only Admin, PM, and Team Leads can view team status logs
  if (userRole !== Role.ADMIN && userRole !== Role.PM && userRole !== Role.TEAM_LEAD) {
    throw new ApiError(403, 'You do not have permission to view team status logs');
  }

  return DailyStatus.find()
    .populate('user', 'name email avatarUrl role department')
    .populate('project', 'name')
    .sort({ date: -1, createdAt: -1 });
};
