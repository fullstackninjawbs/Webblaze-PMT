import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITask extends Document {
  milestone: Types.ObjectId;
  title: string;
  description?: string;
  department?: 'seo' | 'fullstack' | 'design' | 'shopify' | 'wordpress' | 'sales';
  estimatedHours: number;
  spentHours: number;
  startDate?: Date;
  endDate?: Date;
  assignedTo?: Types.ObjectId;
  status: 'unassigned' | 'assigned' | 'in_progress' | 'in_review' | 'rejected' | 'completed' | 'on_hold';
  /** Comment written when the task was last moved to review; prefills the EOD report. */
  workSummary?: string;
  prLink?: string;
  /** When the task last entered in_review. */
  inReviewAt?: Date;
  /** Reason given by the PM when the review was rejected. */
  reviewFeedback?: string;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  attachments?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    milestone: {
      type: Schema.Types.ObjectId,
      ref: 'Milestone',
      required: [true, 'Milestone ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    department: {
      type: String,
      enum: ['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales'],
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
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['unassigned', 'assigned', 'in_progress', 'in_review', 'rejected', 'completed', 'on_hold'],
      default: 'unassigned',
    },
    workSummary: {
      type: String,
    },
    prLink: {
      type: String,
    },
    inReviewAt: {
      type: Date,
    },
    reviewFeedback: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taskSchema.index({ milestone: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ status: 1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
