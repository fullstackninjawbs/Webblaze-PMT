import { baseApi } from '../../app/api';

export interface Milestone {
  _id: string;
  project: string; // project ID or populated project
  title: string;
  estimatedHours: number;
  spentHours?: number;
  startDate?: string;
  endDate?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const milestoneApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMilestonesByProject: builder.query<{ success: boolean; data: Milestone[] }, string>({
      query: (projectId) => `/milestones?projectId=${projectId}`,
      providesTags: (result, _error, projectId) => 
        result?.data 
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Milestone' as const, id: _id })),
              { type: 'Milestone', id: `LIST-${projectId}` },
            ]
          : [{ type: 'Milestone', id: `LIST-${projectId}` }],
    }),
    createMilestone: builder.mutation<{ success: boolean; data: Milestone; message: string }, Partial<Milestone>>({
      query: (body) => ({
        url: '/milestones',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [{ type: 'Milestone', id: `LIST-${body.project}` }],
    }),
    updateMilestone: builder.mutation<{ success: boolean; data: Milestone; message: string }, Partial<Milestone> & { _id: string }>({
      query: (body) => ({
        url: `/milestones/${body._id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) => result ? [{ type: 'Milestone', id: result.data._id }] : [],
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
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
} = milestoneApi;
