import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../users/user.model';
import { ApiError } from '../../utils/ApiError';
import { sendInviteEmail, sendResetPasswordEmail, verifyEmailTransport } from '../../utils/emailService';

const generateTokens = (userId: string, tokenVersion: number = 0) => {
  const accessToken = jwt.sign(
    { id: userId, tokenVersion },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '30d') as any }
  );

  const refreshToken = jwt.sign(
    { id: userId, tokenVersion },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '365d') as any }
  );

  return { accessToken, refreshToken };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: IUser; tokens: { accessToken: string; refreshToken: string } }> => {
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = generateTokens((user._id as any).toString(), user.tokenVersion || 0);
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

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    const tokens = generateTokens((user._id as any).toString(), user.tokenVersion);
    return { user, tokens };
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired invitation token');
  }
};

export const refreshTokens = async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { id: string; tokenVersion?: number };
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or disabled');
    }
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
      throw new ApiError(401, 'Session invalidated due to role change');
    }
    return generateTokens((user._id as any).toString(), user.tokenVersion || 0);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  // Sign out other sessions; the controller issues fresh tokens for this one
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  return generateTokens(String(user._id), user.tokenVersion);
};

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();

export const requestPasswordReset = async (email: string): Promise<void> => {
  // Check email delivery BEFORE looking up the user, so an outage gives every caller
  // the same answer and does not reveal which addresses have accounts.
  const emailReady = await verifyEmailTransport();
  if (!emailReady && process.env.NODE_ENV === 'production') {
    throw new ApiError(503, 'Password reset emails are temporarily unavailable. Please contact your administrator.', 'EMAIL_UNAVAILABLE');
  }

  const user = await User.findOne({ email: normalizeEmail(email), isActive: true });
  if (!user) {
    // Return early silently so we don't leak user existence
    return;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  const sent = await sendResetPasswordEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  if (!sent && process.env.NODE_ENV === 'production') {
    throw new ApiError(503, 'Password reset emails are temporarily unavailable. Please contact your administrator.', 'EMAIL_UNAVAILABLE');
  }
};

export const resetPassword = async (rawToken: string, newPassword: string): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user || !user.isActive) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  // Sign out every existing session: whoever had the old password loses access
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};
