import { User } from './user.model';
import { containsRegex } from '../../utils/regex';
import { ApiError } from '../../utils/ApiError';
import { Role } from '../../types';
import { normalizeDept } from '../../utils/department';
import { paginate, PaginationParams, PaginatedResult } from '../../utils/paginate';

export class UserService {
  static async getUsers(user?: any, params: PaginationParams = {}): Promise<PaginatedResult<any>> {
    // Conditions are combined with $and so a search can never replace the department scope
    const conditions: any[] = [];
    if (user && (user.role === Role.TEAM_LEAD || user.role === Role.TEAM_MEMBER)) {
      if (user.department) {
        const deptVariants = normalizeDept(user.department);
        const regexes = deptVariants.map((d) => new RegExp(d, 'i'));
        conditions.push({
          $or: [
            { department: { $in: regexes } },
            { department: user.department }
          ],
        });
      }
    }
    if (params.search) {
      conditions.push({
        $or: [
          { name: { $regex: containsRegex(params.search) } },
          { email: { $regex: containsRegex(params.search) } }
        ],
      });
    }
    const query: any = conditions.length > 0 ? { $and: conditions } : {};
    return paginate(User, query, params, [], '-password -tokenVersion -resetPasswordToken -resetPasswordExpires');
  }

  static async getUserById(id: string) {
    const user = await User.findById(id).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  /** Self-service: a user may change only their own name, email and avatar. */
  static async updateMyProfile(userId: string, data: { name?: string; email?: string; avatarUrl?: string }) {
    const update: any = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl;
    if (data.email !== undefined) {
      const taken = await User.exists({ email: data.email, _id: { $ne: userId } });
      if (taken) throw new ApiError(400, 'That email is already used by another account', 'DUPLICATE_EMAIL');
      update.email = data.email;
    }
    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
      .select('-password -tokenVersion -resetPasswordToken -resetPasswordExpires');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  static async updateUser(id: string, data: any, currentUserId?: string) {
    if (data.password) delete data.password; // Do not update password here

    const existingUser = await User.findById(id);
    if (!existingUser) throw new ApiError(404, 'User not found');

    if (data.email && data.email !== existingUser.email) {
      const taken = await User.exists({ email: data.email, _id: { $ne: id } });
      if (taken) throw new ApiError(400, 'That email is already used by another account', 'DUPLICATE_EMAIL');
    }

    // Prevent a user from changing their own role or deactivating their own account
    if (currentUserId && id.toString() === currentUserId.toString()) {
      if (data.role && data.role !== existingUser.role) {
        throw new ApiError(400, 'You cannot change your own role');
      }
      if (data.isActive !== undefined && data.isActive === false) {
        throw new ApiError(400, 'You cannot deactivate your own account');
      }
    }

    // If role or account status is updated, increment tokenVersion to force auto-logout
    if ((data.role && data.role !== existingUser.role) || (data.isActive !== undefined && data.isActive !== existingUser.isActive)) {
      data.tokenVersion = (existingUser.tokenVersion || 0) + 1;
    }

    const effectiveRole = data.role !== undefined ? data.role : existingUser.role;
    const updateOps: any = { ...data };
    if (effectiveRole === Role.ADMIN || effectiveRole === Role.PM) {
      delete updateOps.department;
      updateOps.$unset = { ...(updateOps.$unset || {}), department: 1 };
    }

    const user = await User.findByIdAndUpdate(id, updateOps, { new: true, runValidators: true }).select('-password');
    return user;
  }

  static async deleteUser(id: string, currentUserId?: string) {
    if (currentUserId && id.toString() === currentUserId.toString()) {
      throw new ApiError(400, 'You cannot delete your own account');
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}
