import { User } from './user.model';
import { ApiError } from '../../utils/ApiError';

export class UserService {
  static async getUsers() {
    return User.find().select('-password').sort({ createdAt: -1 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateUser(id: string, data: any) {
    if (data.password) delete data.password; // Do not update password here
    const user = await User.findByIdAndUpdate(id, data, { new: true }).select('-password');
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  static async deleteUser(id: string) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}
