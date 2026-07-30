import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRelease extends Document {
  project: Types.ObjectId;
  department: 'seo' | 'fullstack' | 'design' | 'shopify' | 'wordpress' | 'sales';
  teamMember?: Types.ObjectId;
  details: string;
  releaseDate: Date;
  status: 'draft' | 'scheduled' | 'in_review' | 'released';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const releaseSchema = new Schema<IRelease>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    department: {
      type: String,
      enum: ['seo', 'fullstack', 'design', 'shopify', 'wordpress', 'sales'],
      required: [true, 'Department is required'],
    },
    teamMember: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    details: {
      type: String,
      required: [true, 'Release details are required'],
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'in_review', 'released'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

releaseSchema.index({ project: 1 });
releaseSchema.index({ status: 1 });
releaseSchema.index({ releaseDate: 1 });

export const Release = mongoose.model<IRelease>('Release', releaseSchema);
