import { User } from './user.model';
import { ApiError } from '../../utils/ApiError';

export class UserService {
  static async getUsers() {
    return User.find().select('-password').sort({ createdAt: -1 });
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
