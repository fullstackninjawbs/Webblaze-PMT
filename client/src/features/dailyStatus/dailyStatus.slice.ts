import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';

export interface DailyStatus {
  _id: string;
  user: User;
  project?: any;
  workDone: string;
  plannedWork: string;
  blockers?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export const dailyStatusApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyDailyStatuses: builder.query<{ success: boolean; data: DailyStatus[] }, void>({
      query: () => '/daily-status/my',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'DailyStatus' as const, id: _id })),
              { type: 'DailyStatus', id: 'MY-LIST' },
            ]
          : [{ type: 'DailyStatus', id: 'MY-LIST' }],
    }),
    getTeamDailyStatuses: builder.query<{ success: boolean; data: DailyStatus[] }, void>({
      query: () => '/daily-status/team',
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: 'DailyStatus' as const, id: _id })),
              { type: 'DailyStatus', id: 'TEAM-LIST' },
            ]
          : [{ type: 'DailyStatus', id: 'TEAM-LIST' }],
    }),
    submitDailyStatus: builder.mutation<{ success: boolean; data: DailyStatus; message: string }, Partial<DailyStatus>>({
      query: (body) => ({
        url: '/daily-status',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'DailyStatus', id: 'MY-LIST' },
        { type: 'DailyStatus', id: 'TEAM-LIST' }
      ],
    }),
  }),
});

export const {
  useGetMyDailyStatusesQuery,
  useGetTeamDailyStatusesQuery,
  useSubmitDailyStatusMutation,
} = dailyStatusApi;
