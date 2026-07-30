import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { Role } from '../../types';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: Role;
  department?: 'design' | 'development' | 'seo';
  isActive: boolean;
  avatarUrl?: string;
  tokenVersion?: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    role: { type: String, enum: Object.values(Role), required: true },
    department: { type: String, enum: ['design', 'development', 'seo'] },
    isActive: { type: Boolean, default: true },
    avatarUrl: { type: String },
    tokenVersion: { type: Number, default: 0 },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Transform to JSON
UserSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  }
});

export const User = mongoose.model<IUser>('User', UserSchema);
