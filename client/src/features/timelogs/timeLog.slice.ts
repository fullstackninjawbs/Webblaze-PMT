import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';
import { Task } from '../tasks/task.slice';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: PaginationMeta;
}

export interface TimeLog {
  _id: string;
  task: Task | string;
  user: User | string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberHoursSummary {
  userId: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  assignedHours: number;
  spentHours: number;
  pendingHours: number;
}

export const timeLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveTimer: builder.query<{ success: boolean; data: TimeLog | null }, void>({
      query: () => '/timelogs/active',
      providesTags: ['ActiveTimer'],
    }),
    getTeamTimeLogs: builder.query<PaginatedResponse<TimeLog[]>, { page?: number; limit?: number; sort?: string; status?: string } | void>({
      query: (params) => {
        let url = '/timelogs/team';
        if (params) {
          const queryParams = new URLSearchParams();
          if (params.page) queryParams.append('page', params.page.toString());
          if (params.limit) queryParams.append('limit', params.limit.toString());
          if (params.sort) queryParams.append('sort', params.sort);
          if (params.status) queryParams.append('status', params.status);
          const qs = queryParams.toString();
          if (qs) url += `?${qs}`;
        }
        return url;
      },
      providesTags: ['TimeLog'],
    }),
    getTeamHoursSummary: builder.query<{ success: boolean; data: TeamMemberHoursSummary[] }, void>({
      query: () => '/timelogs/team-hours-summary',
      providesTags: ['TimeLog', 'Task'],
    }),
    getTimeLogsByTask: builder.query<{ success: boolean; data: TimeLog[] }, string>({
      query: (taskId) => `/timelogs/task/${taskId}`,
      providesTags: (result, _error, taskId) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'TimeLog' as const, id: _id })),
              { type: 'TimeLog', id: `LIST-TASK-${taskId}` },
            ]
          : [{ type: 'TimeLog', id: `LIST-TASK-${taskId}` }],
    }),
    getMyEodSummary: builder.query<{ success: boolean; data: { projects: { id: string; name: string; timeSpent: number; tasks: { id: string; title: string }[] }[] } }, void>({
      query: () => '/timelogs/my-eod-summary',
      providesTags: ['TimeLog'],
    }),
    startTimer: builder.mutation<{ success: boolean; data: TimeLog; message: string }, { taskId: string; description?: string }>({
      query: (body) => ({
        url: '/timelogs/start',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        'ActiveTimer', 
        { type: 'TimeLog', id: `LIST-TASK-${taskId}` },
        { type: 'Task', id: taskId }, // Invalidate task as its status might change to in_progress
      ],
    }),
    stopTimer: builder.mutation<{ success: boolean; data: TimeLog; message: string }, { description?: string }>({
      query: (body) => ({
        url: '/timelogs/stop',
        method: 'POST',
        body,
      }),
      invalidatesTags: (result) => {
        const taskId = result?.data
          ? (typeof result.data.task === 'string' ? result.data.task : result.data.task._id)
          : null;
        return [
          'ActiveTimer',
          'Task',
          'Milestone',
          ...(taskId ? [{ type: 'TimeLog' as const, id: `LIST-TASK-${taskId}` }, { type: 'Task' as const, id: taskId }] : []),
        ];
      },
    }),
    createManualTimeLog: builder.mutation<{ success: boolean; data: TimeLog; message: string }, { taskId: string; hours: number; description?: string }>({
      query: (body) => ({
        url: '/timelogs/manual',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        'TimeLog',
        'Task',
        'Milestone',
        'Project',
        { type: 'TimeLog', id: `LIST-TASK-${taskId}` },
      ],
    }),
    deleteTimeLog: builder.mutation<{ success: boolean; message: string }, { id: string; taskId?: string }>({
      query: ({ id }) => ({
        url: `/timelogs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { taskId }) => [
        'TimeLog',
        'Task',
        'Milestone',
        'Project',
        ...(taskId ? [{ type: 'TimeLog' as const, id: `LIST-TASK-${taskId}` }, { type: 'Task' as const, id: taskId }] : []),
      ],
    }),
    clearTaskTimeLogs: builder.mutation<{ success: boolean; message: string }, string>({
      query: (taskId) => ({
        url: `/timelogs/task/${taskId}/clear`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, taskId) => [
        'TimeLog',
        'Task',
        'Milestone',
        'Project',
        { type: 'TimeLog', id: `LIST-TASK-${taskId}` },
        { type: 'Task', id: taskId },
      ],
    }),
  }),
});

export const {
  useGetActiveTimerQuery,
  useGetTimeLogsByTaskQuery,
  useStartTimerMutation,
  useStopTimerMutation,
  useGetTeamTimeLogsQuery,
  useGetTeamHoursSummaryQuery,
  useCreateManualTimeLogMutation,
  useDeleteTimeLogMutation,
  useClearTaskTimeLogsMutation,
  useGetMyEodSummaryQuery,
} = timeLogApi;
