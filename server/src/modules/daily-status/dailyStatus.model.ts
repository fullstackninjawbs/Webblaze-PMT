import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDailyStatus extends Document {
  user: Types.ObjectId;
  project?: Types.ObjectId;
  workDone: string;
  plannedWork?: string;
  blockers?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dailyStatusSchema = new Schema<IDailyStatus>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    workDone: {
      type: String,
      required: [true, 'Work done description is required'],
      trim: true,
    },
    plannedWork: {
      type: String,
      trim: true,
      default: '',
    },
    blockers: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
dailyStatusSchema.index({ user: 1 });
dailyStatusSchema.index({ date: -1 });
dailyStatusSchema.index({ project: 1 });

export const DailyStatus = mongoose.model<IDailyStatus>('DailyStatus', dailyStatusSchema);
