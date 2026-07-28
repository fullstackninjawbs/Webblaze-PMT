import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITimeLog extends Document {
  task: Types.ObjectId;
  user: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  durationSeconds?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const timeLogSchema = new Schema<ITimeLog>(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
timeLogSchema.index({ task: 1 });
timeLogSchema.index({ user: 1, endTime: 1 }); // Useful for finding active timers (endTime: null/undefined)

export const TimeLog = mongoose.model<ITimeLog>('TimeLog', timeLogSchema);
