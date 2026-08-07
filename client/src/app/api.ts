import { createApi, fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Get stored refreshToken as fallback for cross-origin HTTP deployments
    const state = api.getState() as RootState;
    const storedRefreshToken = state.auth.refreshToken || localStorage.getItem('auth_refresh_token');

    // Try to refresh using cookie OR body payload
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: { refreshToken: storedRefreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Store the new tokens
      const data = (refreshResult.data as any).data;
      api.dispatch({
        type: 'auth/updateToken',
        payload: { accessToken: data.accessToken, refreshToken: data.refreshToken },
      });

      // Retry the original query with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch({ type: 'auth/logoutLocally' });
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Project', 'Client', 'Task', 'Milestone', 'TimeLog', 'ActiveTimer', 'Todo', 'Release', 'Invoice', 'DailyStatus'],
  endpoints: () => ({}),
});
