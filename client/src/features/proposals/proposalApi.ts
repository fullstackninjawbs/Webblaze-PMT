import { baseApi } from '../../app/api';
import { Proposal } from './types';

export const proposalApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProposals: builder.query<{ data: Proposal[]; meta: any }, Record<string, any>>({
      query: (params) => ({
        url: '/proposals',
        params,
      }),
      providesTags: ['Proposal'],
    }),
    getProposalById: builder.query<Proposal, string>({
      query: (id) => `/proposals/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Proposal', id }],
    }),
    createProposal: builder.mutation<Proposal, Partial<Proposal>>({
      query: (body) => ({
        url: '/proposals',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Proposal'],
    }),
    updateProposal: builder.mutation<Proposal, { id: string; data: Partial<Proposal> }>({
      query: ({ id, data }) => ({
        url: `/proposals/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Proposal', id }, 'Proposal'],
    }),
    getKpiSummary: builder.query<any, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: '/proposals/kpi-summary',
        params,
      }),
      providesTags: ['Proposal'],
    }),
    getFollowUpQueue: builder.query<Proposal[], void>({
      query: () => '/proposals/follow-up-queue',
      providesTags: ['Proposal'],
    }),
    convertToProject: builder.mutation<any, string>({
      query: (id) => ({
        url: `/proposals/${id}/convert`,
        method: 'POST',
      }),
      invalidatesTags: ['Proposal', 'Project'],
    }),
  }),
});

export const {
  useGetProposalsQuery,
  useGetProposalByIdQuery,
  useCreateProposalMutation,
  useUpdateProposalMutation,
  useGetKpiSummaryQuery,
  useGetFollowUpQueueQuery,
  useConvertToProjectMutation,
} = proposalApi;
