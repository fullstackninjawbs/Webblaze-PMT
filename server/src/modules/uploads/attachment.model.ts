import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttachment extends Document {
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

export const Attachment = mongoose.model<IAttachment>('Attachment', attachmentSchema);
