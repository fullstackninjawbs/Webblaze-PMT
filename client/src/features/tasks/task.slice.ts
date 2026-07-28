import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';

export interface Task {
  _id: string;
  milestone: string | { _id: string; project: string | { _id: string; name: string } };
  title: string;
  description?: string;
  department?: 'design' | 'development' | 'seo';
  estimatedHours: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: User | string;
  status: 'assigned' | 'in_progress' | 'in_review' | 'completed';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasksByMilestone: builder.query<{ success: boolean; data: Task[] }, string>({
      query: (milestoneId) => `/tasks?milestoneId=${milestoneId}`,
      providesTags: (result, _error, milestoneId) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
              { type: 'Task', id: `LIST-MILESTONE-${milestoneId}` },
            ]
          : [{ type: 'Task', id: `LIST-MILESTONE-${milestoneId}` }],
    }),
    getTasksByUser: builder.query<{ success: boolean; data: Task[] }, string>({
      query: (userId) => `/tasks?userId=${userId}`,
      providesTags: (result, _error, userId) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
              { type: 'Task', id: `LIST-USER-${userId}` },
            ]
          : [{ type: 'Task', id: `LIST-USER-${userId}` }],
    }),
    createTask: builder.mutation<{ success: boolean; data: Task; message: string }, Partial<Task>>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'Task', id: `LIST-MILESTONE-${body.milestone}` },
        { type: 'Task', id: `LIST-USER-${body.assignedTo}` }
      ],
    }),
    updateTask: builder.mutation<{ success: boolean; data: Task; message: string }, Partial<Task> & { _id: string }>({
      query: (body) => ({
        url: `/tasks/${body._id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) => result ? [{ type: 'Task', id: result.data._id }] : [],
    }),
    deleteTask: builder.mutation<{ success: boolean; data: null; message: string }, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetTasksByMilestoneQuery,
  useGetTasksByUserQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
