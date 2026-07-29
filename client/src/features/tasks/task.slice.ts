import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';
import { Attachment } from '../uploads/upload.slice';

export interface Task {
  _id: string;
  milestone: string | { _id: string; title: string; project: string | { _id: string; name: string } };
  title: string;
  description?: string;
  department?: 'design' | 'development' | 'seo';
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
    getTaskById: builder.query<{ success: boolean; data: Task }, string>({
      query: (id) => `/tasks/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Task', id }],
    }),
    getAllTasks: builder.query<{ success: boolean; data: Task[] }, void>({
      query: () => '/tasks',
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
  useGetTaskByIdQuery,
  useGetAllTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} = taskApi;
