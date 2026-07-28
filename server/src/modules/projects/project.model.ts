import mongoose, { Schema, Document } from 'mongoose';
import { ProjectStatus } from '../../types';

export interface IProject extends Document {
  name: string;
  client: mongoose.Types.ObjectId;
  totalBudget?: number;
  receivedAmount?: number;
  pendingAmount?: number;
  description?: string;
  type?: string;
  status: ProjectStatus;
  team: mongoose.Types.ObjectId[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema(
  {
    name: { type: String, required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    totalBudget: { type: Number },
    receivedAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    description: { type: String },
    type: { type: String },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },
    team: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

// Indexes
projectSchema.index({ client: 1 });
projectSchema.index({ status: 1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);
