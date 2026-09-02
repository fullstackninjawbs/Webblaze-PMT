import { User } from './user.model';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';

export class UserService {
  static async getUsers(user?: any, params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    const query: any = {};
    if (user && (user.role === Role.TEAM_LEAD || user.role === Role.TEAM_MEMBER)) {
      if (user.department) {
        const deptVariants = normalizeDept(user.department);
        const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
        query.$or = [
          { department: { $in: regexes } },
          { department: user.department }
        ];
      }
    }
    if (params.search) {
      query.$or = [
        { name: { $regex: new RegExp(params.search, 'i') } },
        { email: { $regex: new RegExp(params.search, 'i') } }
      ];
    }
    return paginate(User, query, params, [], '-password');
  }

  static async getUserById(id: string) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateUser(id: string, data: any) {
    if (data.password) delete data.password; // Do not update password here
    
    const existingUser = await User.findById(id);
    if (!existingUser) throw new ApiError(404, 'User not found');

    // If role or account status is updated, increment tokenVersion to force auto-logout
    if ((data.role && data.role !== existingUser.role) || (data.isActive !== undefined && data.isActive !== existingUser.isActive)) {
      data.tokenVersion = (existingUser.tokenVersion || 0) + 1;
    }

    const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
    return user;
  }

  static async deleteUser(id: string) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}
