import { DailyStatus, IDailyStatus } from './dailyStatus.model';
import { User } from '../users/user.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';
import { RequestUser, getUserId } from '../../utils/access';

const populateOptions = [
  { path: 'user', select: 'name email avatarUrl role department' },
  { path: 'project', select: 'name' },
];

export const createDailyStatus = async (data: Partial<IDailyStatus>): Promise<IDailyStatus> => {
  const dailyStatus = await DailyStatus.create(data);
  return dailyStatus.populate(populateOptions);
};

export const getMyDailyStatuses = async (userId: string): Promise<IDailyStatus[]> => {
  return DailyStatus.find({ user: userId })
    .populate('project', 'name')
    .sort({ date: -1, createdAt: -1 });
};

/**
 * Team view:
 *  - Admin / PM see everyone
 *  - Team Lead sees their own department only
 */
export const getTeamDailyStatuses = async (user: RequestUser): Promise<IDailyStatus[]> => {
  const query: any = {};

  if (user.role === Role.TEAM_LEAD) {
    if (user.department) {
      const regexes = normalizeDept(user.department).map((d) => new RegExp(d, 'i'));
      const deptUsers = await User.find({
        $or: [{ department: { $in: regexes } }, { department: user.department }],
      }).select('_id');
      query.user = { $in: deptUsers.map((u) => u._id) };
    } else {
      query.user = getUserId(user);
    }
  } else if (user.role !== Role.ADMIN && user.role !== Role.PM) {
    throw new ApiError(403, 'You do not have permission to view team status logs');
  }

  return DailyStatus.find(query)
    .populate(populateOptions)
    .sort({ date: -1, createdAt: -1 });
};
