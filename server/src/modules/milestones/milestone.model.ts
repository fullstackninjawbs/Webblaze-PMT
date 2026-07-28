import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMilestone extends Document {
  project: Types.ObjectId;
  title: string;
  estimatedHours: number;
  startDate?: Date;
  endDate?: Date;
  spentHours: number;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
    },
    estimatedHours: {
      type: Number,
      required: [true, 'Estimated hours are required'],
      min: [0, 'Estimated hours cannot be negative'],
    },
    spentHours: {
      type: Number,
      default: 0,
      min: [0, 'Spent hours cannot be negative'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'on_hold', 'completed', 'cancelled'],
      default: 'not_started',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for spentHours can be added later when TimeLogs are implemented

export const Milestone = mongoose.model<IMilestone>('Milestone', milestoneSchema);
