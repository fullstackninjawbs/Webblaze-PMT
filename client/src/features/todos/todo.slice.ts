import { baseApi } from '../../app/api';
import { User } from '../auth/auth.slice';
import { Project } from '../projects/project.slice';

export interface Todo {
  _id: string;
  user: User;
  title: string;
  relatedProject?: Project;
  estimatedTime?: number;
  status: 'pending' | 'in_progress' | 'done';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const todoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTodos: builder.query<{ success: boolean; data: Todo[] }, void>({
      query: () => '/todos',
      providesTags: ['Todo'],
    }),
    createTodo: builder.mutation<{ success: boolean; data: Todo }, Partial<Todo>>({
      query: (body) => ({
        url: '/todos',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Todo'],
    }),
    updateTodo: builder.mutation<{ success: boolean; data: Todo }, { id: string; data: Partial<Todo> }>({
      query: ({ id, data }) => ({
        url: `/todos/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Todo'],
    }),
    deleteTodo: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/todos/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Todo'],
    }),
  }),
});

export const {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} = todoApi;
