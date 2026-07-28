import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';
import { Task } from '../tasks/task.slice';

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

export const timeLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getActiveTimer: builder.query<{ success: boolean; data: TimeLog | null }, void>({
      query: () => '/timelogs/active',
      providesTags: ['ActiveTimer'],
    }),
    getTeamTimeLogs: builder.query<{ success: boolean; data: TimeLog[] }, void>({
      query: () => '/timelogs/team',
      providesTags: ['TimeLog'],
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
      invalidatesTags: (result) => 
        result?.data 
        ? [
            'ActiveTimer', 
            { type: 'TimeLog', id: `LIST-TASK-${typeof result.data.task === 'string' ? result.data.task : result.data.task._id}` }
          ] 
        : ['ActiveTimer'],
    }),
  }),
});

export const {
  useGetActiveTimerQuery,
  useGetTimeLogsByTaskQuery,
  useStartTimerMutation,
  useStopTimerMutation,
  useGetTeamTimeLogsQuery,
} = timeLogApi;
