import { baseApi } from '../../app/api';

export interface Client {
  _id: string;
  name: string;
  email?: string;
  address?: string;
  contactNumber?: string;
  country?: string;
  companyName?: string;
  source?: 'upwork' | 'direct';
  billingType?: 'hourly' | 'fixed';
  createdAt: string;
  updatedAt: string;
}

export const clientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<{ success: boolean; data: Client[] }, void>({
      query: () => '/clients',
      providesTags: ['Client'],
    }),
    getClientById: builder.query<{ success: boolean; data: Client }, string>({
      query: (id) => `/clients/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Client', id }],
    }),
    createClient: builder.mutation<{ success: boolean; data: Client }, Partial<Client>>({
      query: (body) => ({
        url: '/clients',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Client'],
    }),
    updateClient: builder.mutation<{ success: boolean; data: Client }, { id: string; data: Partial<Client> }>({
      query: ({ id, data }) => ({
        url: `/clients/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Client', id }, 'Client'],
    }),
    deleteClient: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/clients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Client'],
    }),
  }),
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;
