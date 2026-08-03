import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITeamTodo extends Document {
  user: Types.ObjectId;
  title: string;
  relatedProject?: Types.ObjectId;
  estimatedTime?: number;
  status: 'pending' | 'in_progress' | 'blocked' | 'done';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const teamTodoSchema = new Schema<ITeamTodo>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Todo title is required'],
      trim: true,
    },
    relatedProject: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    estimatedTime: {
      type: Number,
      min: [0, 'Estimated time cannot be negative'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'blocked', 'done'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
teamTodoSchema.index({ user: 1 });
teamTodoSchema.index({ status: 1 });

export const TeamTodo = mongoose.model<ITeamTodo>('TeamTodo', teamTodoSchema);
