import jwt from 'jsonwebtoken';
import { User, IUser } from '../users/user.model';
import { ApiError } from '../../utils/ApiError';
import { sendInviteEmail } from '../../utils/emailService';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as any }
  );

  return { accessToken, refreshToken };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = generateTokens((user._id as any).toString());
  return { user, tokens };
};

export const registerUser = async (userData: any): Promise<{ user: IUser }> => {
  const existing = await User.findOne({ email: userData.email });
  if (existing) {
    throw new ApiError(400, 'User with this email already exists', 'DUPLICATE_EMAIL');
  }
  const user = await User.create(userData);

  // Generate 48h Invitation Magic Token
  const inviteToken = jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: '48h' }
  );

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteUrl = `${clientUrl}/login?inviteToken=${inviteToken}&email=${encodeURIComponent(user.email)}`;

  // Dispatch Invitation Email asynchronously
  sendInviteEmail({
    to: user.email,
    name: user.name,
    role: user.role,
    inviteUrl,
    tempPassword: userData.password,
  });

  return { user };
};

export const acceptInviteToken = async (
  token: string
): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account not found or disabled');
    }

    const tokens = generateTokens((user._id as any).toString());
    return { user, tokens };
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired invitation token');
  }
};

export const refreshTokens = async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or disabled');
    }
    return generateTokens((user._id as any).toString());
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
};
