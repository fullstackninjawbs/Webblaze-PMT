import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPaymentDetail {
  paymentDate: Date;
  method: string;
  transactionId?: string;
  amount: number;
}

export interface IInvoice extends Document {
  project: Types.ObjectId;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
  paymentDetails: IPaymentDetail[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentDetailSchema = new Schema<IPaymentDetail>({
  paymentDate: { type: Date, required: true },
  method: { type: String, required: true },
  transactionId: { type: String },
  amount: { type: Number, required: true },
});

const invoiceSchema = new Schema<IInvoice>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Invoice number is required'],
      unique: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: [true, 'Issue date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    receivedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: function(this: any) {
        return this.totalAmount - (this.receivedAmount || 0);
      },
    },
    status: {
      type: String,
      enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue'],
      default: 'draft',
    },
    paymentDetails: [paymentDetailSchema],
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

invoiceSchema.index({ project: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });

// Middleware to compute pending amount and update status automatically
invoiceSchema.pre('save', function(next) {
  if (this.isModified('totalAmount') || this.isModified('receivedAmount')) {
    this.pendingAmount = this.totalAmount - this.receivedAmount;
    
    // Auto-update status if not draft
    if (this.status !== 'draft') {
      if (this.pendingAmount <= 0) {
        this.status = 'paid';
      } else if (this.receivedAmount > 0) {
        this.status = 'partially_paid';
      }
    }
  }
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
