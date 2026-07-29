import { Invoice, IInvoice } from './invoice.model';
import { Project } from '../projects/project.model';
import { ApiError } from '../../utils/ApiError';

const updateProjectFinancials = async (projectId: string) => {
  const invoices = await Invoice.find({ project: projectId, status: { $ne: 'draft' } });
  
  const receivedAmount = invoices.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);
  const pendingAmount = invoices.reduce((sum, inv) => sum + (inv.pendingAmount || 0), 0);
  
  await Project.findByIdAndUpdate(projectId, {
    receivedAmount,
    pendingAmount,
  });
};

export const createInvoice = async (data: Partial<IInvoice>): Promise<IInvoice> => {
  const existing = await Invoice.findOne({ invoiceNumber: data.invoiceNumber });
  if (existing) {
    throw new ApiError(400, 'Invoice number already exists');
  }

  const invoice = await Invoice.create(data);
  
  if (invoice.status !== 'draft') {
    await updateProjectFinancials(invoice.project.toString());
  }

  return invoice.populate(['project']);
};

export const getAllInvoices = async (filters: any = {}): Promise<IInvoice[]> => {
  return Invoice.find(filters)
    .populate('project', 'name client')
    .sort({ issueDate: -1 });
};

export const getInvoiceById = async (id: string): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id).populate('project', 'name client');
  if (!invoice) throw new ApiError(404, 'Invoice not found');
  return invoice;
};

export const updateInvoice = async (id: string, updateData: Partial<IInvoice>): Promise<IInvoice> => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new ApiError(404, 'Invoice not found');

  // If changing invoice number, ensure uniqueness
  if (updateData.invoiceNumber && updateData.invoiceNumber !== invoice.invoiceNumber) {
    const existing = await Invoice.findOne({ invoiceNumber: updateData.invoiceNumber });
    if (existing) throw new ApiError(400, 'Invoice number already exists');
  }

  // Handle payments if added
  if (updateData.paymentDetails) {
    invoice.paymentDetails = updateData.paymentDetails as any;
    let received = 0;
    invoice.paymentDetails.forEach(p => {
      received += p.amount;
    });
    invoice.receivedAmount = received;
    
    delete updateData.paymentDetails;
    delete updateData.receivedAmount;
  }

  // Assign other fields
  Object.assign(invoice, updateData);

  const updated = await invoice.save();
  await updated.populate('project', 'name client');
  
  if (updated) {
    // Only sent/paid invoices affect project financials
    await updateProjectFinancials(updated.project._id.toString());
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
