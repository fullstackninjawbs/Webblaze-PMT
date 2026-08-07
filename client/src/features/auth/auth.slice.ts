import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { baseApi } from '../../app/api';
import { Role } from '../../types';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const getInitialUser = (): User | null => {
  try {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getInitialToken = (): string | null => {
  return localStorage.getItem('auth_token') || null;
};

const getInitialRefreshToken = (): string | null => {
  return localStorage.getItem('auth_refresh_token') || null;
};

const initialUser = getInitialUser();
const initialToken = getInitialToken();
const initialRefreshToken = getInitialRefreshToken();

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  refreshToken: initialRefreshToken,
  isAuthenticated: !!(initialUser && (initialToken || initialRefreshToken)),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logoutLocally: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
        localStorage.setItem('auth_refresh_token', action.payload.refreshToken);
      }
      state.isAuthenticated = true;
      localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
      localStorage.setItem('auth_token', action.payload.accessToken);
    },
    updateToken: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken?: string } | string>
    ) => {
      if (typeof action.payload === 'string') {
        state.token = action.payload;
        localStorage.setItem('auth_token', action.payload);
      } else {
        state.token = action.payload.accessToken;
        localStorage.setItem('auth_token', action.payload.accessToken);
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
          localStorage.setItem('auth_refresh_token', action.payload.refreshToken);
        }
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('auth_user', JSON.stringify(action.payload));
    },
  },
});

export const { logoutLocally, setCredentials, updateToken, setUser } = authSlice.actions;
export default authSlice.reducer;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logoutLocally());
        } catch {
          // ignore error
        }
      }
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data.data.user));
        } catch {
          // Ignore error, it will just leave user as null
        }
      }
    }),
    changePassword: builder.mutation<{ success: boolean; message: string }, any>({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
    acceptInvite: builder.mutation<{ success: boolean; data: { user: User; accessToken: string } }, { inviteToken: string }>({
      query: (body) => ({
        url: '/auth/accept-invite',
        method: 'POST',
        body,
      }),
    }),
    forgotPassword: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<{ success: boolean; message: string }, { token: string; newPassword: string }>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useChangePasswordMutation,
  useAcceptInviteMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
