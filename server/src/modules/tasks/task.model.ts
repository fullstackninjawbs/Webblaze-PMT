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
  status: 'assigned' | 'in_progress' | 'in_review' | 'completed' | 'on_hold';
  workSummary?: string;
  prLink?: string;
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
      enum: ['assigned', 'in_progress', 'in_review', 'completed', 'on_hold'],
      default: 'assigned',
    },
    workSummary: {
      type: String,
    },
    prLink: {
      type: String,
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
