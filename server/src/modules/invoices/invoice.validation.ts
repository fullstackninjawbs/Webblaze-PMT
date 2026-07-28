import { z } from 'zod';

const paymentDetailSchema = z.object({
  paymentDate: z.string().datetime(),
  method: z.string(),
  transactionId: z.string().optional(),
  amount: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    project: z.string().min(1, 'Project ID is required'),
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    issueDate: z.string().datetime(),
    dueDate: z.string().datetime(),
    totalAmount: z.number().min(0, 'Total amount must be positive'),
    status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue']).optional(),
  }),
});

export const updateInvoiceSchema = z.object({
  body: z.object({
    project: z.string().optional(),
    invoiceNumber: z.string().optional(),
    issueDate: z.string().datetime().optional(),
    dueDate: z.string().datetime().optional(),
    totalAmount: z.number().min(0).optional(),
    receivedAmount: z.number().min(0).optional(),
    status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue']).optional(),
    paymentDetails: z.array(paymentDetailSchema).optional(),
  }),
});
