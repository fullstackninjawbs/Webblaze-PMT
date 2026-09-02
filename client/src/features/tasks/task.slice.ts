import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';
import { Attachment } from '../uploads/upload.slice';
import { PaginatedResponse } from '../../types';

export interface Task {
  _id: string;
  milestone: string | { _id: string; title: string; project: string | { _id: string; name: string } };
  title: string;
  description?: string;
  department?: 'seo' | 'fullstack' | 'design' | 'shopify' | 'wordpress' | 'sales' | 'pm' | 'admin';
  estimatedHours: number;
  spentHours?: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: User | string;
  status: 'assigned' | 'in_progress' | 'in_review' | 'completed';
  attachments?: Attachment[] | string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const taskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTasksByMilestone: builder.query<PaginatedResponse<Task[]>, { milestoneId: string; page?: number; limit?: number; search?: string; status?: string; [key: string]: any }>({
      query: (params) => {
        let url = `/tasks`;
        if (params) {
          const qs = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) qs.append(key, value.toString());
          });
          url += `?${qs.toString()}`;
        }
        return url;
      },
      providesTags: (result, _error, params) =>
        result?.data
          ? [
            ...result.data.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
            { type: 'Task', id: `LIST-MILESTONE-${params.milestoneId}` },
          ]
          : [{ type: 'Task', id: `LIST-MILESTONE-${params.milestoneId}` }],
    }),
    getTasksByUser: builder.query<PaginatedResponse<Task[]>, { userId: string; page?: number; limit?: number; search?: string; status?: string; [key: string]: any }>({
      query: (params) => {
        let url = `/tasks`;
        if (params) {
          const qs = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) qs.append(key, value.toString());
          });
          url += `?${qs.toString()}`;
        }
        return url;
      },
      providesTags: (result, _error, params) =>
        result?.data
          ? [
            ...result.data.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
            { type: 'Task', id: `LIST-USER-${params.userId}` },
          ]
          : [{ type: 'Task', id: `LIST-USER-${params.userId}` }],
    }),
    getTaskById: builder.query<{ success: boolean; data: Task }, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),
    getAllTasks: builder.query<PaginatedResponse<Task[]>, { page?: number; limit?: number; search?: string; status?: string; department?: string; userId?: string; [key: string]: any } | void>({
      query: (params) => {
        let url = `/tasks`;
        if (params) {
          const qs = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) qs.append(key, value.toString());
          });
          if (qs.toString()) url += `?${qs.toString()}`;
        }
        return url;
      },
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ _id }) => ({ type: 'Task' as const, id: _id })),
            { type: 'Task', id: 'LIST-ALL' },
          ]
          : [{ type: 'Task', id: 'LIST-ALL' }],
    }),
    createTask: builder.mutation<{ success: boolean; data: Task; message: string }, Partial<Task>>({
      query: (body) => ({
        url: '/tasks',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'Task', id: `LIST-MILESTONE-${body.milestone}` },
        { type: 'Task', id: `LIST-USER-${body.assignedTo}` },
        { type: 'Task', id: 'LIST-ALL' }
      ],
    }),
    updateTask: builder.mutation<{ success: boolean; data: Task; message: string }, Partial<Task> & { _id: string }>({
      query: (body) => ({
        url: `/tasks/${body._id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result) =>
        result
          ? [
              { type: 'Task', id: result.data._id },
              { type: 'Task', id: 'LIST-ALL' },
              {
                type: 'Task',
                id: `LIST-MILESTONE-${
                  typeof result.data.milestone === 'object' ? result.data.milestone._id : result.data.milestone
                }`,
              },
              {
                type: 'Task',
                id: `LIST-USER-${
                  typeof result.data.assignedTo === 'object' ? (result.data.assignedTo as any)._id : result.data.assignedTo
                }`,
              },
              'Task',
              'Milestone',
            ]
          : ['Task', 'Milestone'],
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
  useGetTaskByIdQuery,
  useGetAllTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
