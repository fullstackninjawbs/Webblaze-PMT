import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ClientService } from './client.service';

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await ClientService.createClient(req.body, (req as any).user._id as string);
  res.status(201).json({ success: true, data: client });
});

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const clients = await ClientService.getClients();
  res.status(200).json({ success: true, data: clients });
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const client = await ClientService.getClientById(req.params.id);
  res.status(200).json({ success: true, data: client });
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await ClientService.updateClient(req.params.id, req.body);
  res.status(200).json({ success: true, data: client });
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  await ClientService.deleteClient(req.params.id);
  res.status(200).json({ success: true, data: {} });
});
