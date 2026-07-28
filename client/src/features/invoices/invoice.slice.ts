import { baseApi } from '../../app/api';
import { Project } from '../projects/project.slice';
import { User } from '../auth/auth.slice';

export interface PaymentDetail {
  _id?: string;
  paymentDate: string;
  method: string;
  transactionId?: string;
  amount: number;
}

export interface Invoice {
  _id: string;
  project: string | Project;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
  paymentDetails: PaymentDetail[];
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<{ success: boolean; data: Invoice[] }, { project?: string } | void>({
      query: (params) => {
        let url = '/invoices';
        if (params && params.project) {
          url += `?project=${params.project}`;
        }
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Invoice' as const, id: _id })),
              { type: 'Invoice', id: 'LIST' },
            ]
          : [{ type: 'Invoice', id: 'LIST' }],
    }),
    getInvoiceById: builder.query<{ success: boolean; data: Invoice }, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation<{ success: boolean; data: Invoice; message: string }, Partial<Invoice>>({
      query: (body) => ({
        url: '/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }, { type: 'Project', id: 'LIST' }],
    }),
    updateInvoice: builder.mutation<{ success: boolean; data: Invoice; message: string }, Partial<Invoice> & { _id: string }>({
      query: (body) => ({
        url: `/invoices/${body._id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { _id }) => [
        { type: 'Invoice', id: _id },
        { type: 'Invoice', id: 'LIST' },
        { type: 'Project', id: 'LIST' }
      ],
    }),
    deleteInvoice: builder.mutation<{ success: boolean; data: null; message: string }, string>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Invoice', id: 'LIST' }, { type: 'Project', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = invoiceApi;
