import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as invoiceService from './invoice.service';

export const createInvoice = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id || (req as any).user.id;
  const invoiceData = { ...req.body, createdBy: userId };
  
  const invoice = await invoiceService.createInvoice(invoiceData);
  
  res.status(201).json({
    success: true,
    data: invoice,
    message: 'Invoice created successfully',
  });
});

export const getInvoices = asyncHandler(async (req: Request, res: Response) => {
  const filters: any = {};
  if (req.query.status) filters.status = req.query.status;
  if (req.query.project) filters.project = req.query.project;
  
  const invoices = await invoiceService.getAllInvoices(filters);
  
  res.status(200).json({
    success: true,
    data: invoices,
  });
});

export const getInvoiceById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);
  
  res.status(200).json({
    success: true,
    data: invoice,
  });
});

export const updateInvoice = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
  
  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Invoice updated successfully',
  });
});

export const deleteInvoice = asyncHandler(async (req: Request, res: Response) => {
  await invoiceService.deleteInvoice(req.params.id);
  
  res.status(200).json({
    success: true,
    data: null,
    message: 'Invoice deleted successfully',
  });
});
