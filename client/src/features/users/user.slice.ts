import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';
import { PaginatedResponse } from '../../types';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<User[]>, { page?: number; limit?: number; search?: string; [key: string]: any } | void>({
      query: (params) => {
        let url = '/users';
        if (params) {
          const qs = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) qs.append(key, value.toString());
          });
          if (qs.toString()) url += `?${qs.toString()}`;
        }
        return url;
      },
      providesTags: ['User'],
    }),
    getUserById: builder.query<{ success: boolean; data: User }, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    registerUser: builder.mutation<{ success: boolean; data: User }, Partial<User> & { password?: string }>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation<{ success: boolean; data: User }, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
    }),
    deleteUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useRegisterUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
