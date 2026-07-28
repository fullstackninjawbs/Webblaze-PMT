import { Client, IClient } from './client.model';
import { ApiError } from '../../utils/ApiError';

export class ClientService {
  static async createClient(data: Partial<IClient>, userId: string) {
    return Client.create({ ...data, createdBy: userId });
  }

  static async getClients() {
    return Client.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
  }

  static async getClientById(id: string) {
    const client = await Client.findById(id).populate('createdBy', 'name email');
    if (!client) throw new ApiError(404, 'Client not found');
    return client;
  }

  static async updateClient(id: string, data: Partial<IClient>) {
    const client = await Client.findByIdAndUpdate(id, data, { new: true });
    if (!client) throw new ApiError(404, 'Client not found');
    return client;
  }

  static async deleteClient(id: string) {
    const client = await Client.findByIdAndDelete(id);
    if (!client) throw new ApiError(404, 'Client not found');
    return client;
  }
}
