import mongoose, { Schema, Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email?: string;
  address?: string;
  contactNumber?: string;
  country?: string;
  companyName?: string;
  source?: 'upwork' | 'direct';
  billingType?: 'hourly' | 'fixed';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    contactNumber: { type: String },
    country: { type: String },
    companyName: { type: String },
    source: { type: String, enum: ['upwork', 'direct'] },
    billingType: { type: String, enum: ['hourly', 'fixed'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const Client = mongoose.model<IClient>('Client', clientSchema);
