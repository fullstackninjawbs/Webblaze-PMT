import { baseApi } from '../../app/api';
import { PaginatedResponse } from '../../types';

export interface Milestone {
  _id: string;
  project: string; // project ID or populated project
  title: string;
  description?: string;
  estimatedHours: number;
  spentHours?: number;
  startDate?: string;
  endDate?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export const milestoneApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMilestonesByProject: builder.query<PaginatedResponse<Milestone[]>, { projectId: string; page?: number; limit?: number; sort?: string; [key: string]: any }>({
      query: (params) => {
        let url = `/milestones`;
        if (params) {
          const queryParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, value.toString());
            }
          });
          const qs = queryParams.toString();
          if (qs) url += `?${qs}`;
        }
        return url;
      },
      providesTags: (result, _error, params) => 
        result?.data 
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Milestone' as const, id: _id })),
              { type: 'Milestone', id: `LIST-${params.projectId}` },
            ]
          : [{ type: 'Milestone', id: `LIST-${params.projectId}` }],
    }),
    getMilestoneById: builder.query<{ success: boolean; data: Milestone }, string>({
      query: (id) => `/milestones/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Milestone', id }],
    }),
    createMilestone: builder.mutation<{ success: boolean; data: Milestone; message: string }, Partial<Milestone>>({
      query: (body) => ({
        url: '/milestones',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: 'Milestone', id: `LIST-${body.project}` }, 'Milestone'],
    }),
    updateMilestone: builder.mutation<{ success: boolean; data: Milestone; message: string }, Partial<Milestone> & { _id: string }>({
      query: (body) => ({
        url: `/milestones/${body._id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'Milestone', id: body._id },
        { type: 'Milestone', id: `LIST-${body.project}` },
        'Milestone',
      ],
    }),
    deleteMilestone: builder.mutation<{ success: boolean; data: null; message: string }, string>({
      query: (id) => ({
        url: `/milestones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Milestone'],
    }),
  }),
});

export const {
  useGetMilestonesByProjectQuery,
  useGetMilestoneByIdQuery,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
} = milestoneApi;
