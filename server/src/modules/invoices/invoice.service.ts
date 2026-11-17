import { Invoice, IInvoice } from './invoice.model';
import { Project } from '../projects/project.model';
import { ApiError } from '../../utils/ApiError';

const updateProjectFinancials = async (projectId: string) => {
  const invoices = await Invoice.find({ project: projectId, status: { $ne: 'draft' } });

  const receivedAmount = invoices.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);
  const pendingAmount = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);

  await Project.findByIdAndUpdate(projectId, {
    receivedAmount: Math.round(receivedAmount * 100) / 100,
    pendingAmount: Math.round(pendingAmount * 100) / 100,
  });
};

/**
 * Overdue depends on today's date, not on an edit, so it is refreshed whenever invoices
 * are read: issued invoices past their due date with money owed become overdue.
 */
const refreshOverdueInvoices = async () => {
  await Invoice.updateMany(
    { status: { $in: ['sent', 'partially_paid'] }, dueDate: { $lt: new Date() }, pendingAmount: { $gt: 0 } },
    { $set: { status: 'overdue' } }
  );
};

const assertNoOverpayment = (totalAmount: number, payments: { amount: number }[] = []) => {
  const received = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  if (received - totalAmount > 0.005) {
    throw new ApiError(
      400,
      `Payments (${received.toFixed(2)}) cannot exceed the invoice total (${Number(totalAmount).toFixed(2)})`,
      'OVERPAYMENT'
    );
  }
};

export const createInvoice = async (data: Partial<IInvoice>): Promise<IInvoice> => {
  const existing = await Invoice.findOne({ invoiceNumber: data.invoiceNumber });
  if (existing) {
    throw new ApiError(400, 'Invoice number already exists');
  }

  // Amounts and payment-driven statuses are derived; a new invoice has no payments yet
  const { receivedAmount: _r, pendingAmount: _p, paymentDetails: _d, ...safeData } = data as any;
  const invoice = await Invoice.create({ ...safeData, paymentDetails: [] });

  await updateProjectFinancials(invoice.project.toString());
  return invoice.populate('project', 'name client');
};

export const getAllInvoices = async (filters: any = {}): Promise<IInvoice[]> => {
  await refreshOverdueInvoices();
  return Invoice.find(filters)
    .populate('project', 'name client')
    .sort({ issueDate: -1 });
};

export const getInvoiceById = async (id: string): Promise<IInvoice> => {
  await refreshOverdueInvoices();
  const invoice = await Invoice.findById(id).populate('project', 'name client');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  return invoice;
};

export const updateInvoice = async (id: string, updateData: Partial<IInvoice>): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  const previousProjectId = invoice.project.toString();

  // If changing invoice number, ensure uniqueness
  if (updateData.invoiceNumber && updateData.invoiceNumber !== invoice.invoiceNumber) {
    const existing = await Invoice.findOne({ invoiceNumber: updateData.invoiceNumber });
    if (existing) throw new ApiError(400, 'Invoice number already exists');
  }

  // receivedAmount / pendingAmount always come from the payments, never from the request
  const { paymentDetails, receivedAmount: _r, pendingAmount: _p, ...fields } = updateData as any;

  const nextTotal = fields.totalAmount ?? invoice.totalAmount;
  const nextPayments = paymentDetails ?? invoice.paymentDetails;
  assertNoOverpayment(nextTotal, nextPayments);

  if (paymentDetails) invoice.paymentDetails = paymentDetails;
  Object.assign(invoice, fields);

  const updated = await invoice.save(); // the save hook recomputes amounts and status
  await updated.populate('project', 'name client');

  const newProjectId = String((updated.project as any)?._id || updated.project);
  await updateProjectFinancials(newProjectId);
  // Moving an invoice to another project must also correct the old project's totals
  if (newProjectId !== previousProjectId) {
    await updateProjectFinancials(previousProjectId);
  }

  return updated;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  const projectId = invoice.project.toString();
  await Invoice.findByIdAndDelete(id);

  await updateProjectFinancials(projectId);
};
